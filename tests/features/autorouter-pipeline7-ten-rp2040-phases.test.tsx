import { expect, test } from "bun:test"
import { createRp2040PhasedCircuit } from "./autorouter-ten-rp2040-phases.fixture"

test("pipeline7 across ten one-trace RP2040 phases", async () => {
  const { circuit, autoroutingPhaseIoStack, autoroutingSolverNames } =
    createRp2040PhasedCircuit("beta_pipeline7")

  const start = performance.now()
  await circuit.renderUntilSettled()
  const durationMs = performance.now() - start

  console.table({
    pipeline7: {
      durationMs: durationMs.toFixed(2),
      finalPhaseOutputTraces:
        autoroutingPhaseIoStack.at(-1)?.endSimpleRouteJson?.traces?.length ?? 0,
      traces: circuit.db.pcb_trace.list().length,
      vias: circuit.db.pcb_via.list().length,
      traceErrors: circuit.db.pcb_trace_error.list().length,
    },
  })

  expect(autoroutingPhaseIoStack).toHaveLength(10)
  expect(
    autoroutingPhaseIoStack.map(
      (phase) => phase.startSimpleRouteJson?.connections.length,
    ),
  ).toEqual(Array(10).fill(1))
  expect(
    autoroutingPhaseIoStack.map(
      (phase) => phase.startSimpleRouteJson?.traces?.length ?? 0,
    ),
  ).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  expect(
    autoroutingPhaseIoStack.map(
      (phase) => phase.endSimpleRouteJson?.traces?.length ?? 0,
    ),
  ).toEqual(Array(10).fill(1))
  expect(autoroutingSolverNames).toEqual(
    Array(10).fill("AutoroutingPipelineSolver7_MultiGraph"),
  )
  expect(circuit.db.pcb_trace.list()).toHaveLength(10)
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace_error.list()).toEqual([])

  await expect(autoroutingPhaseIoStack).toMatchAutoroutingPhaseIoStackSnapshot(
    import.meta.path,
    "autorouter-pipeline7-ten-rp2040-phases",
    circuit,
    { diffThresholdPercent: 2 },
  )
}, 60_000)
