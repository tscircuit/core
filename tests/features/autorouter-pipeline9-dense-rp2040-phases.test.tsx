import { expect, test } from "bun:test"
import {
  DENSE_RP2040_PHASE_COUNT,
  createDenseRp2040PhasedCircuit,
} from "./autorouter-dense-rp2040-phases.fixture"

test("pipeline9 across dense one-trace RP2040 phases", async () => {
  const { circuit, autoroutingPhaseIoStack, autoroutingSolverNames } =
    createDenseRp2040PhasedCircuit("beta_pipeline9")

  const start = performance.now()
  await circuit.renderUntilSettled()
  const durationMs = performance.now() - start

  console.table({
    pipeline9: {
      durationMs: durationMs.toFixed(2),
      completedPhases: autoroutingPhaseIoStack.length,
      finalPhaseOutputTraces:
        autoroutingPhaseIoStack.at(-1)?.endSimpleRouteJson?.traces?.length ?? 0,
      traces: circuit.db.pcb_trace.list().length,
      vias: circuit.db.pcb_via.list().length,
      autoroutingErrors: circuit.db.pcb_autorouting_error.list().length,
      traceErrors: circuit.db.pcb_trace_error.list().length,
    },
  })

  expect(autoroutingPhaseIoStack).toHaveLength(DENSE_RP2040_PHASE_COUNT)
  expect(
    autoroutingPhaseIoStack.map(
      (phase) => phase.startSimpleRouteJson?.connections.length,
    ),
  ).toEqual(Array(DENSE_RP2040_PHASE_COUNT).fill(1))
  expect(
    autoroutingPhaseIoStack.map(
      (phase) => phase.startSimpleRouteJson?.traces?.length ?? 0,
    ),
  ).toEqual(
    Array.from({ length: DENSE_RP2040_PHASE_COUNT }, (_, index) => index),
  )
  expect(
    autoroutingPhaseIoStack.map(
      (phase) => phase.endSimpleRouteJson?.traces?.length ?? 0,
    ),
  ).toEqual(
    Array.from({ length: DENSE_RP2040_PHASE_COUNT }, (_, index) => index + 1),
  )
  expect(autoroutingSolverNames).toEqual(
    Array(DENSE_RP2040_PHASE_COUNT).fill(
      "AutoroutingPipelineSolver9_PreloadedTraceGraph",
    ),
  )
  expect(circuit.db.pcb_trace.list()).toHaveLength(DENSE_RP2040_PHASE_COUNT)
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])

  await expect(autoroutingPhaseIoStack).toMatchAutoroutingPhaseIoStackSnapshot(
    import.meta.path,
    "autorouter-pipeline9-dense-rp2040-phases",
    circuit,
    { diffThresholdPercent: 2 },
  )
}, 180_000)
