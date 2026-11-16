import { expect, test } from "bun:test"
import {
  checkEachPcbTraceNonOverlapping,
  checkHoleTraceClearance,
  checkPadTraceClearance,
  checkPadPadClearance,
  checkTracesAreContiguous,
} from "@tscircuit/checks"
import { pcb_trace } from "circuit-json"
import { BusLanesAutorouter } from "lib/utils/autorouting/BusLanesAutorouter"
import type { SimplifiedPcbTrace } from "lib/utils/autorouting/SimpleRouteJson"
import { getMemoryBytePlatedHoleFixture } from "./fixtures/memory-byte-plated-hole.fixture"

test("repro: bus routing rejects a supplied plated-hole passage", () => {
  const { circuit, input, groundTrace, signalSourceTraces } =
    getMemoryBytePlatedHoleFixture()
  const original = structuredClone(input)
  const originalGround = structuredClone(groundTrace)
  expect(input.connections).toHaveLength(8)
  expect(input.traces).toHaveLength(1)
  expect(
    input.traces![0]!.route.some(
      (point) => point.route_type === "through_obstacle",
    ),
  ).toBe(true)
  let routes: SimplifiedPcbTrace[] = []
  let routingError: Error | undefined
  try {
    routes = new BusLanesAutorouter(input).solveSync()
  } catch (error) {
    routingError = error instanceof Error ? error : new Error(String(error))
  }
  // Record the released core's input rejection, not a successful routing run.
  expect(routingError?.message).toContain(
    "Fixed trace changes layer without a via",
  )
  expect(routes).toHaveLength(0)
  expect(input).toEqual(original)
  for (const route of routes) {
    const sourceTrace = signalSourceTraces.find(
      (trace) => trace.source_trace_id === route.connection_name,
    )!
    const connection = input.connections.find(
      (connection) => connection.name === route.connection_name,
    )!
    const [start, end] = connection.pointsToConnect
    expect(route.route[0]).toMatchObject({
      x: start!.x,
      y: start!.y,
      layer: start!.layer,
    })
    expect(route.route.at(-1)).toMatchObject({
      x: end!.x,
      y: end!.y,
      layer: end!.layer,
    })
    expect(
      route.route.every(
        (point) => point.route_type === "wire" && point.layer === "top",
      ),
    ).toBe(true)
    circuit.db.pcb_trace.insert(
      pcb_trace.parse({
        ...route,
        source_trace_id: sourceTrace.source_trace_id,
        subcircuit_id: sourceTrace.subcircuit_id,
        route: route.route.map((point, pointIndex) => ({
          ...point,
          ...(pointIndex === 0
            ? { start_pcb_port_id: connection.pointsToConnect[0]!.pcb_port_id }
            : {}),
          ...(pointIndex === route.route.length - 1
            ? { end_pcb_port_id: connection.pointsToConnect[1]!.pcb_port_id }
            : {}),
        })),
      }),
    )
  }
  circuit.db.pcb_note_text.insert({
    text: `DDR_BYTE: ${routes.length}/8 new DQ routes | Existing GND copper retained | 0 new vias`,
    anchor_position: { x: 0, y: 7.3 },
    anchor_alignment: "center",
    font: "tscircuit2024",
    font_size: 0.4,
    layer: "top",
    color: routingError ? "#c52828" : "#215bca",
  })
  circuit.db.pcb_note_text.insert({
    text:
      routingError?.message ??
      "Plated-hole passage accepted; all eight DQ connections routed on top",
    anchor_position: { x: 0, y: -8.6 },
    anchor_alignment: "center",
    font: "tscircuit2024",
    font_size: 0.35,
    layer: "top",
    color: routingError ? "#c52828" : "#215bca",
  })
  expect(circuit.db.pcb_trace.get(groundTrace.pcb_trace_id)).toEqual(
    originalGround,
  )
  const json = circuit.getCircuitJson()
  expect(
    checkEachPcbTraceNonOverlapping(json).filter((finding) =>
      finding.type.endsWith("_error"),
    ),
  ).toHaveLength(0)
  expect(
    checkHoleTraceClearance(json).filter((finding) =>
      finding.type.endsWith("_error"),
    ),
  ).toHaveLength(0)
  expect(
    checkPadTraceClearance(json, { minClearance: 0.1 }).filter((finding) =>
      finding.type.endsWith("_error"),
    ),
  ).toHaveLength(0)
  expect(
    checkPadPadClearance(json, { minClearance: 0.1 }).filter((finding) =>
      finding.type.endsWith("_error"),
    ),
  ).toHaveLength(0)
  expect(
    checkTracesAreContiguous(json).filter((finding) =>
      finding.type.endsWith("_error"),
    ),
  ).toHaveLength(0)
  expect(circuit.db.pcb_via.list()).toHaveLength(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    backgroundColor: "white",
    width: 1500,
    height: 1000,
    shouldDrawRatsNest: false,
  })
})
