import { expect, test } from "bun:test"
import { SOLVERS } from "lib/solvers"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("differential pair solver failure preserves routed PCB traces", async (): Promise<void> => {
  const { circuit } = getTestFixture()
  const originalDifferentialPairSolver = SOLVERS.DifferentialPairSolver
  let solverInvocationCount = 0
  let pcbTracesAtSolverStart:
    | ReturnType<typeof circuit.db.pcb_trace.list>
    | undefined
  let pcbTracesAtPostProcessError:
    | ReturnType<typeof circuit.db.pcb_trace.list>
    | undefined

  circuit.on("autorouting:error", (event) => {
    if (
      event.error?.message.includes(
        "simulated differential pair solver failure",
      )
    ) {
      pcbTracesAtPostProcessError = structuredClone(circuit.db.pcb_trace.list())
    }
  })

  class ThrowingDifferentialPairSolver {
    constructor() {
      solverInvocationCount += 1
      pcbTracesAtSolverStart = structuredClone(circuit.db.pcb_trace.list())
    }

    solve(): void {
      throw new Error("simulated differential pair solver failure")
    }

    getOutput(): never {
      throw new Error("getOutput should not run after solver failure")
    }
  }

  circuit.add(
    <board width="28mm" height="16mm" autorouter="sequential-trace">
      <differentialpair
        name="USB"
        positiveConnection="USB_P"
        negativeConnection="USB_N"
        maxLengthSkew={0.05}
      />
      <testpoint name="P_LEFT" footprintVariant="pad" pcbX={-10} pcbY={2} />
      <testpoint name="P_RIGHT" footprintVariant="pad" pcbX={10} pcbY={2} />
      <testpoint name="N_LEFT" footprintVariant="pad" pcbX={-10} pcbY={-2} />
      <testpoint name="N_RIGHT" footprintVariant="pad" pcbX={10} pcbY={-2} />
      <trace
        name="USB_P"
        from=".P_LEFT > .pin1"
        to=".P_RIGHT > .pin1"
        pcbStraightLine
      />
      <trace
        name="USB_N"
        from=".N_LEFT > .pin1"
        to=".N_RIGHT > .pin1"
        pcbStraightLine
      />
      <pcbnotetext
        pcbX={0}
        pcbY={5}
        fontSize={0.7}
        text="Differential-pair post-processing: USB_P / USB_N, max skew 0.05mm, preserve routes on failure"
      />
    </board>,
  )

  SOLVERS.DifferentialPairSolver =
    ThrowingDifferentialPairSolver as unknown as typeof SOLVERS.DifferentialPairSolver
  try {
    // Sequential trace routing and post-processing both run synchronously in
    // this render, keeping the shared solver substitution tightly scoped.
    circuit.render()
  } finally {
    SOLVERS.DifferentialPairSolver = originalDifferentialPairSolver
  }

  await circuit.renderUntilSettled()

  expect(solverInvocationCount).toBe(1)
  expect(pcbTracesAtSolverStart).toBeDefined()
  expect(pcbTracesAtPostProcessError).toEqual(pcbTracesAtSolverStart!)
  expect(pcbTracesAtSolverStart!.length).toBe(2)
  expect(circuit.db.pcb_trace.list()).toEqual(pcbTracesAtSolverStart!)

  const postProcessErrors = circuit.db.pcb_autorouting_error
    .list()
    .filter((error) =>
      error.message.includes("simulated differential pair solver failure"),
    )
  expect(postProcessErrors).toHaveLength(1)
  expect(postProcessErrors[0]?.message).toContain(
    "Differential-pair post-processing failed",
  )
  expect(postProcessErrors[0]?.message).toContain("source_trace_")
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
