import { expect, test } from "bun:test"
import { restoreFixedPcbTraces } from "lib/components/primitive-components/Group/restore-fixed-pcb-traces"
import type { SimplifiedPcbTrace } from "lib/utils/autorouting/SimpleRouteJson"

test("fixed restoration removes replacement IDs and duplicates without reordering other routes", () => {
  const fixedTrace: SimplifiedPcbTrace = {
    type: "pcb_trace",
    pcb_trace_id: "manual",
    connection_name: "manual_net",
    route: [
      { route_type: "wire", x: 0, y: 0, width: 0.3, layer: "top" },
      { route_type: "wire", x: 1, y: 1, width: 0.3, layer: "top" },
    ],
  }
  const signalBefore = { ...fixedTrace, pcb_trace_id: "signal_before" }
  const signalAfter = { ...fixedTrace, pcb_trace_id: "signal_after" }
  const replacement = {
    ...fixedTrace,
    pcb_trace_id: "solver_replacement",
    __replaces_pcb_trace_id: fixedTrace.pcb_trace_id,
    route: [],
  }
  const solverOutput = [
    signalBefore,
    replacement,
    { ...fixedTrace, route: [] },
    signalAfter,
  ]
  const originalOutput = structuredClone(solverOutput)
  expect(
    restoreFixedPcbTraces({
      stageOutputPcbTraces: solverOutput,
      stageInputFixedPcbTraces: [fixedTrace],
    }),
  ).toEqual([signalBefore, fixedTrace, signalAfter])
  expect(solverOutput).toEqual(originalOutput)
  expect(
    restoreFixedPcbTraces({
      stageOutputPcbTraces: [signalBefore],
      stageInputFixedPcbTraces: [fixedTrace, fixedTrace],
    }),
  ).toEqual([signalBefore, fixedTrace])
  expect(
    restoreFixedPcbTraces({
      stageOutputPcbTraces: solverOutput,
      stageInputFixedPcbTraces: [],
    }),
  ).toBe(solverOutput)
})
