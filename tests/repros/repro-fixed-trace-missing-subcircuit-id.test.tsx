import { expect, test } from "bun:test"
import {
  checkEachPcbTraceNonOverlapping,
  checkViaTraceClearance,
} from "@tscircuit/checks"
import type { AnyCircuitElement, PcbTrace } from "circuit-json"
import { TscircuitAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import {
  getCircuitJsonPcbTraceRoute,
  type PcbTraceRoutePointWithSrjMetadata,
} from "lib/utils/autorouting/get-circuit-json-pcb-trace-route"
import { getFixedCopperScopeFixture } from "./fixtures/fixed-copper-scope.fixture"

test("missing fixed-copper scope lets the next routing phase short POWER", async () => {
  const { circuit, power, signal, imported, subcircuitId } =
    await getFixedCopperScopeFixture()
  const original = structuredClone(imported)
  const global = getSimpleRouteJsonFromCircuitJson({
    circuitJson: imported,
  }).simpleRouteJson
  const scoped = getSimpleRouteJsonFromCircuitJson({
    circuitJson: imported,
    subcircuit_id: subcircuitId,
  }).simpleRouteJson
  // This baseline intentionally records the bug: neither query retains POWER.
  expect(global.traces).toBeUndefined()
  expect(scoped.traces).toBeUndefined()
  const routingInput = {
    ...scoped,
    connections: scoped.connections.filter(
      (connection) => connection.name === signal.source_trace_id,
    ),
  }
  expect(routingInput.connections).toHaveLength(1)
  const output = new TscircuitAutorouter(routingInput, {
    autorouterVersion: "beta_pipeline9",
  }).solveSync()
  const signalOutput = output.find(
    (trace) => trace.connection_name === signal.source_trace_id,
  )!
  expect(signalOutput).toBeDefined()
  const routedSignal: PcbTrace = {
    type: "pcb_trace",
    pcb_trace_id: "pcb_trace_next_phase_signal",
    source_trace_id: signal.source_trace_id,
    subcircuit_id: subcircuitId,
    route: getCircuitJsonPcbTraceRoute(
      signalOutput.route as PcbTraceRoutePointWithSrjMetadata[],
    ),
  }
  const viaPoints = signalOutput.route.filter(
    (point) => point.route_type === "via",
  )
  const vias: AnyCircuitElement[] = viaPoints.map((point, index) => ({
    type: "pcb_via",
    pcb_via_id: `pcb_via_next_phase_${index}`,
    pcb_trace_id: routedSignal.pcb_trace_id,
    x: point.x,
    y: point.y,
    hole_diameter: point.via_hole_diameter ?? 0.2,
    outer_diameter: point.via_diameter ?? 0.3,
    layers: ["top", "bottom"],
    from_layer: point.from_layer as "top" | "bottom",
    to_layer: point.to_layer as "top" | "bottom",
  }))
  const routedCircuitJson = [...imported, routedSignal, ...vias]
  const drc = checkEachPcbTraceNonOverlapping(routedCircuitJson)
  expect(drc).toHaveLength(1)
  expect(drc[0]!.message).toContain("accidental contact")
  expect(drc[0]!.center).toEqual({ x: 0, y: 0 })
  expect(viaPoints).toHaveLength(0)
  expect(checkViaTraceClearance(routedCircuitJson)).toHaveLength(0)
  expect(imported).toEqual(original)
  expect(
    routedCircuitJson.find(
      (element) =>
        element.type === "pcb_trace" &&
        element.pcb_trace_id === power.pcb_trace_id,
    ),
  ).toEqual(original.find((element) => element.type === "pcb_trace"))
  const status = circuit.db.pcb_note_text.insert({
    font: "tscircuit2024",
    text: `BUG: SIGNAL shorts POWER on TOP | ${drc.length} DRC error`,
    anchor_position: { x: 0, y: 3.7 },
    anchor_alignment: "center",
    font_size: 0.4,
    layer: "top",
    color: "#ffcc00",
    ccw_rotation: 0,
  })
  const crossing = circuit.db.pcb_note_text.insert({
    font: "tscircuit2024",
    text: "SHORT at crossing",
    anchor_position: { x: 1.8, y: -0.7 },
    anchor_alignment: "center",
    font_size: 0.35,
    layer: "top",
    color: "#ffcc00",
    ccw_rotation: 0,
  })
  await expect([
    ...routedCircuitJson,
    ...drc,
    status,
    crossing,
  ]).toMatchPcbSnapshot(import.meta.path)
})
