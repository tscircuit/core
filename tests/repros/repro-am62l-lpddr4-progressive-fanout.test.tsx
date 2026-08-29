import { test } from "bun:test"
import { renderAm62lLpddr4Fanout } from "tests/fixtures/create-am62l-lpddr4-fanout"

test("routes seven DDR buses including clock, DQS0, DQS1, and reset with the regular fanout solver", async () => {
  await renderAm62lLpddr4Fanout({
    fanoutSolverLabel: "@tscircuit/fanout-solver",
    includePowerPlaneFanout: true,
    snapshotPath: import.meta.path,
  })
}, 300_000)
