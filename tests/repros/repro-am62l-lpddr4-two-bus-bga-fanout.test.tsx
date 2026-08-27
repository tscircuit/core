import { test } from "bun:test"
import { createBgaFanoutAlgorithm } from "tests/fixtures/create-bga-fanout-algorithm"
import { renderAm62lLpddr4TwoBusFanout } from "tests/fixtures/create-am62l-lpddr4-two-bus-fanout"

test("routes two DDR byte buses with bga-fanout-solver", async () => {
  await renderAm62lLpddr4TwoBusFanout({
    fanoutAlgorithmFn: createBgaFanoutAlgorithm,
    fanoutSolverLabel: "@tscircuit/bga-fanout-solver",
    includePowerPlaneFanout: true,
    snapshotPath: import.meta.path,
  })
}, 300_000)
