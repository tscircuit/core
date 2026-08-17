import {
  initializeViaStitchSolver,
  ViaStitchSolver,
} from "@tscircuit/via-stitch-solver"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

let initializeViaStitchSolverPromise: Promise<void> | undefined

const ensureViaStitchSolverInitialized = () => {
  initializeViaStitchSolverPromise ??= initializeViaStitchSolver()
  return initializeViaStitchSolverPromise
}

export const getViaStitchingTestFixture = () => {
  const fixture = getTestFixture()

  return {
    ...fixture,
    runViaStitchingPostProcessSolverStep: async () => {
      await fixture.circuit.renderUntilSettled()
      await ensureViaStitchSolverInitialized()

      const solver = new ViaStitchSolver({
        circuitJson: fixture.circuit.getCircuitJson(),
        options: {
          minimumPourWidth: 1.4,
          pourPadding: 0.3,
          viaPitch: 2,
          viaHoleDiameter: 0.3,
          viaOuterDiameter: 0.6,
          endpointClearance: 0.8,
          padMargin: 0.2,
          traceMargin: 0.2,
        },
      })
      solver.solve()

      if (solver.failed) {
        throw new Error(
          solver.error ?? "Via stitching post-process solver failed",
        )
      }

      const output = solver.getOutput()
      for (const pcbCopperPour of output.pcbCopperPours) {
        fixture.circuit.db.pcb_copper_pour.insert(pcbCopperPour)
      }
      for (const pcbVia of output.pcbVias) {
        fixture.circuit.db.pcb_via.insert(pcbVia)
      }

      return output
    },
  }
}
