import { test } from "bun:test"
import { renderAm62lLpddr4Fanout } from "tests/fixtures/create-am62l-lpddr4-fanout"

test("packs bottom decoupling capacitors under the solved AM62L LPDDR4 fanout", async () => {
  await renderAm62lLpddr4Fanout({
    fanoutSolverLabel: "@tscircuit/fanout-solver with packed bottom decoupling",
    includeBottomDecouplingCapacitors: true,
    includePowerPlaneFanout: true,
    snapshotPath: import.meta.path,
  })
}, 300_000)
