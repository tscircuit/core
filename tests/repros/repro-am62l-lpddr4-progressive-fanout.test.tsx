import { test } from "bun:test"
import { renderAm62lLpddr4Fanout } from "tests/fixtures/create-am62l-lpddr4-fanout"

// TODO: Re-enable when the regular fanout solver resolves the PCB trace/via
// overlaps. Still fails with @tscircuit/fanout-solver 0.0.66 (latest checked).
test.skip("routes nine DDR buses including clock, DQS0, DQS1, DMI0, DMI1, and reset with the regular fanout solver", async () => {
  await renderAm62lLpddr4Fanout({
    includePowerPlaneFanout: true,
    snapshotPath: import.meta.path,
  })
}, 300_000)
