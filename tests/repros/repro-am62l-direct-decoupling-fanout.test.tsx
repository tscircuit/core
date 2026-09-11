import { test } from "bun:test"
import { renderAm62lLpddr4Fanout } from "tests/fixtures/create-am62l-lpddr4-fanout"

// fanout-solver 0.0.66 exhausts its search after several minutes. The stacked
// fix updates the solver and enables this exact circuit as a regression test.
test.skip("captures the AM62L fanout failure with its real decoupling network present", async () => {
  await renderAm62lLpddr4Fanout({
    expectFanoutFailure: true,
    fanoutSolverLabel:
      "AM62L32 + LPDDR4: FANOUT WITH 60 REAL DECOUPLING CAPACITORS",
    includeDirectDecouplingNetworkInInitialRender: true,
    includePowerPlaneFanout: true,
    snapshotPath: import.meta.path,
  })
}, 600_000)
