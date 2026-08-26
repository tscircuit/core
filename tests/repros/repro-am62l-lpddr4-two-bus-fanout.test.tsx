import { test } from "bun:test"
import { renderAm62lLpddr4TwoBusFanout } from "tests/fixtures/create-am62l-lpddr4-two-bus-fanout"

test("routes two DDR byte buses with the regular fanout solver", async () => {
  await renderAm62lLpddr4TwoBusFanout({
    fanoutSolverLabel: "@tscircuit/fanout-solver",
    snapshotPath: import.meta.path,
  })
}, 300_000)
