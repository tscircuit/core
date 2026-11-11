import { expect, test } from "bun:test"
import type { PcbTrace as CircuitJsonPcbTrace } from "circuit-json"
import { Board } from "lib/components/normal-components/Board/Board"
import { PcbTrace } from "lib/components/primitive-components/PcbTrace"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("imported footprint traces preserve routes without linking foreign source trace IDs", async () => {
  const { circuit } = getTestFixture()
  const board = new Board({ width: 10, height: 10, routingDisabled: true })
  const unrelatedSourceTrace = circuit.db.source_trace.insert({
    connected_source_port_ids: [],
    connected_source_net_ids: [],
  })
  // Even an ID collision does not establish an association in the new circuit.
  const traces = [
    "missing_source_trace",
    unrelatedSourceTrace.source_trace_id,
  ].map(
    (source_trace_id, index): CircuitJsonPcbTrace => ({
      type: "pcb_trace",
      pcb_trace_id: `imported_trace_${index}`,
      source_trace_id,
      route: [
        { route_type: "wire", x: -2, y: index, layer: "top", width: 0.2 },
        { route_type: "wire", x: 2, y: index, layer: "top", width: 0.2 },
      ],
    }),
  )
  const originalTraces = structuredClone(traces)
  const primitives = createComponentsFromCircuitJson(
    { componentName: "", componentRotation: "0" },
    traces,
  )
  for (const primitive of primitives) {
    expect(primitive).toBeInstanceOf(PcbTrace)
    expect((primitive as PcbTrace).source_trace_id).toBeNull()
    board.add(primitive)
  }
  circuit.add(board)
  await circuit.renderUntilSettled()

  const renderedTraces = circuit.db.pcb_trace.list()
  expect(renderedTraces).toHaveLength(2)
  for (const [index, trace] of renderedTraces.entries()) {
    expect(trace.source_trace_id).toBeUndefined()
    expect(trace.route).toEqual(traces[index].route)
  }
  expect(traces).toEqual(originalTraces)
})
