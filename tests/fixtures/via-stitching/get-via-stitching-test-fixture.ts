import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { ViaStitchingPostProcessSolver } from "./via-stitching-post-process-solver"

export const getViaStitchingTestFixture = () => {
  const fixture = getTestFixture()

  return {
    ...fixture,
    runViaStitchingPostProcessSolverStep: async () => {
      await fixture.circuit.renderUntilSettled()
      const solver = new ViaStitchingPostProcessSolver(fixture.circuit.db)
      solver.solve()

      if (solver.failed) {
        throw new Error(
          solver.error ?? "Via stitching post-process solver failed",
        )
      }

      return solver.getOutput()
    },
  }
}
