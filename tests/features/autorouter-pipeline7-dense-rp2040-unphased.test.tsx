import { expect, test } from "bun:test"
import {
  DENSE_RP2040_PHASE_COUNT,
  createDenseRp2040UnphasedCircuit,
} from "./autorouter-dense-rp2040-phases.fixture"

test("pipeline7 routes the dense RP2040 without phases", async () => {
  const { circuit, autoroutingPhaseIoStack, autoroutingSolverNames } =
    createDenseRp2040UnphasedCircuit("beta_pipeline7")

  const start = performance.now()
  await circuit.renderUntilSettled()
  const durationMs = performance.now() - start

  console.table({
    pipeline7Unphased: {
      durationMs: durationMs.toFixed(2),
      traces: circuit.db.pcb_trace.list().length,
      vias: circuit.db.pcb_via.list().length,
      autoroutingErrors: circuit.db.pcb_autorouting_error.list().length,
      traceErrors: circuit.db.pcb_trace_error.list().length,
    },
  })

  expect(autoroutingSolverNames).toEqual([
    "AutoroutingPipelineSolver7_MultiGraph",
  ])
  expect(autoroutingPhaseIoStack).toHaveLength(1)
  expect(
    autoroutingPhaseIoStack[0]?.startSimpleRouteJson?.connections,
  ).toHaveLength(DENSE_RP2040_PHASE_COUNT)
  expect(circuit.db.pcb_trace.list()).toHaveLength(DENSE_RP2040_PHASE_COUNT)
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])

  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    diffThresholdPercent: 2,
  })
}, 180_000)
