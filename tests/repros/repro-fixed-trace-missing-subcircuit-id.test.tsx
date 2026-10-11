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

test("inherited fixed-copper scope prevents a subsequent phase shorting POWER", async () => {
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
  for (const input of [global, scoped]) {
    expect(input.traces).toContainEqual(
      expect.objectContaining({
        pcb_trace_id: power.pcb_trace_id,
        source_trace_id: power.source_trace_id,
        route: power.route.flatMap((point) =>
          point.route_type === "wire"
            ? [
                {
                  route_type: "wire",
                  x: point.x,
                  y: point.y,
                  layer: point.layer,
                  width: point.width,
                },
              ]
            : [],
        ),
      }),
    )
  }
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
  expect(drc).toHaveLength(0)
  expect(viaPoints).toHaveLength(2)
  expect(
    routedSignal.route.some(
      (point) => point.route_type === "wire" && point.layer === "bottom",
    ),
  ).toBe(true)
  expect(checkViaTraceClearance(routedCircuitJson)).toHaveLength(0)
  expect(imported).toEqual(original)
  // Inference applies only to a retained route with known source ownership.
  // Explicit fresh routing and explicit physical scope keep their policies.
  for (const scope of [undefined, subcircuitId]) {
    expect(
      getSimpleRouteJsonFromCircuitJson({
        circuitJson: imported,
        subcircuit_id: scope,
        ignoreExistingTopLevelPcbRouteState: true,
      }).simpleRouteJson.traces,
    ).toBeUndefined()
  }
  expect(
    getSimpleRouteJsonFromCircuitJson({
      circuitJson: imported.map((element) =>
        element.type === "pcb_trace"
          ? { ...element, subcircuit_id: "subcircuit_other" }
          : element,
      ),
      subcircuit_id: subcircuitId,
    }).simpleRouteJson.traces,
  ).toBeUndefined()
  expect(
    getSimpleRouteJsonFromCircuitJson({
      circuitJson: imported.map((element) =>
        element.type === "source_trace"
          ? { ...element, subcircuit_id: undefined }
          : element,
      ),
    }).simpleRouteJson.traces,
  ).toBeUndefined()
  expect(
    routedCircuitJson.find(
      (element) =>
        element.type === "pcb_trace" &&
        element.pcb_trace_id === power.pcb_trace_id,
    ),
  ).toEqual(original.find((element) => element.type === "pcb_trace"))
  const status = circuit.db.pcb_note_text.insert({
    font: "tscircuit2024",
    text: `FIXED: SIGNAL crosses on BOTTOM | ${drc.length} DRC errors`,
    anchor_position: { x: 0, y: 3.7 },
    anchor_alignment: "center",
    font_size: 0.4,
    layer: "top",
    color: "#ffcc00",
  })
  const crossing = circuit.db.pcb_note_text.insert({
    font: "tscircuit2024",
    text: `BOTTOM crossing: ${viaPoints.length} vias`,
    anchor_position: { x: 3.4, y: -1.4 },
    anchor_alignment: "center",
    font_size: 0.35,
    layer: "top",
    color: "#ffcc00",
  })
  await expect([
    ...routedCircuitJson,
    ...drc,
    status,
    crossing,
  ]).toMatchPcbSnapshot(import.meta.path)
})
