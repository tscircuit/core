import { test } from "bun:test"
import { renderAm62lLpddr4Fanout } from "tests/fixtures/create-am62l-lpddr4-fanout"

// The complete captured nine-bus regression is exercised in fanout-solver.
// Running the same dense search through core exceeds the CI shard time limit.
test.skip("routes nine DDR buses including clock, DQS0, DQS1, DMI0, DMI1, and reset with the regular fanout solver", async () => {
  await renderAm62lLpddr4Fanout({
    includePowerPlaneFanout: true,
    snapshotPath: import.meta.path,
  })
}, 300_000)
