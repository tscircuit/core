import { expect, test } from "bun:test"
import { createDenseRp2040PhasedCircuit } from "./autorouter-dense-rp2040-phases.fixture"

// The third QSPI connection is the first phase pipeline7 cannot reach after
// reserving the capacitor and first two flash routes.
const FAILED_PHASE_INDEX = 12
const CAPTURED_PHASE_COUNT = FAILED_PHASE_INDEX + 1
const parityTest = test.skipIf(
  process.env.TEST_PIPELINE7_PIPELINE9_PARITY === undefined,
)

parityTest(
  "pipeline7 across dense one-trace RP2040 phases",
  async () => {
    const { circuit, autoroutingPhaseIoStack, autoroutingSolverNames } =
      createDenseRp2040PhasedCircuit("beta_pipeline7")

    const start = performance.now()
    await circuit.renderUntilSettled()
    const durationMs = performance.now() - start

    console.table({
      pipeline7: {
        durationMs: durationMs.toFixed(2),
        capturedPhases: autoroutingPhaseIoStack.length,
        finalPhaseOutputTraces:
          autoroutingPhaseIoStack.at(-1)?.endSimpleRouteJson?.traces?.length ??
          0,
        traces: circuit.db.pcb_trace.list().length,
        vias: circuit.db.pcb_via.list().length,
        autoroutingErrors: circuit.db.pcb_autorouting_error.list().length,
        traceErrors: circuit.db.pcb_trace_error.list().length,
      },
    })

    expect(autoroutingPhaseIoStack).toHaveLength(CAPTURED_PHASE_COUNT)
    const phaseStartObstacles = autoroutingPhaseIoStack.map(
      (phase) => phase.startSimpleRouteJson!.obstacles,
    )
    expect(phaseStartObstacles.map((obstacles) => obstacles.length)).toEqual(
      Array(CAPTURED_PHASE_COUNT).fill(phaseStartObstacles[0]!.length),
    )
    for (const obstacles of phaseStartObstacles.slice(1)) {
      expect(obstacles).toEqual(phaseStartObstacles[0])
    }
    expect(
      autoroutingPhaseIoStack.some((phase) =>
        phase.startSimpleRouteJson?.traces?.some((trace) =>
          trace.route.some((routePoint) => routePoint.route_type === "via"),
        ),
      ),
    ).toBe(true)
    expect(
      autoroutingPhaseIoStack.map(
        (phase) => phase.startSimpleRouteJson?.connections.length,
      ),
    ).toEqual(Array(CAPTURED_PHASE_COUNT).fill(1))
    expect(
      autoroutingPhaseIoStack.map(
        (phase) => phase.startSimpleRouteJson?.traces?.length ?? 0,
      ),
    ).toEqual(Array.from({ length: CAPTURED_PHASE_COUNT }, (_, index) => index))
    expect(
      autoroutingPhaseIoStack.map(
        (phase) => phase.endSimpleRouteJson?.traces?.length ?? 0,
      ),
    ).toEqual([...Array(FAILED_PHASE_INDEX).fill(1), 0])
    expect(autoroutingSolverNames).toEqual(
      Array(CAPTURED_PHASE_COUNT).fill("AutoroutingPipelineSolver7_MultiGraph"),
    )
    expect(circuit.db.pcb_trace.list()).toHaveLength(0)
    expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(1)
    expect(circuit.db.pcb_autorouting_error.list()[0]?.message).toContain(
      "Static reachability precheck failed",
    )
    expect(circuit.db.pcb_autorouting_error.list()[0]?.message).toContain(
      "source_trace_12",
    )
    expect(circuit.db.pcb_trace_error.list()).toEqual([])

    await expect(
      autoroutingPhaseIoStack,
    ).toMatchAutoroutingPhaseIoStackSnapshot(
      import.meta.path,
      "autorouter-pipeline7-dense-rp2040-phases",
      circuit,
      { diffThresholdPercent: 2 },
    )
  },
  60_000,
)
