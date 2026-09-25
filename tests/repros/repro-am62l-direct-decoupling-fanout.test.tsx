import { test } from "bun:test"
import { renderAm62lLpddr4Fanout } from "tests/fixtures/create-am62l-lpddr4-fanout"

test("routes the AM62L and LPDDR4 with the real decoupling network present", async () => {
  await renderAm62lLpddr4Fanout({
    fanoutSolverLabel:
      "AM62L32 + LPDDR4: 414 UNIQUE PHASE TRACES · 48 OPEN POWER VIA ENDS",
    includeDirectDecouplingNetworkInInitialRender: true,
    includePowerPlaneFanout: true,
    snapshotPath: import.meta.path,
  })
}, 900_000)
