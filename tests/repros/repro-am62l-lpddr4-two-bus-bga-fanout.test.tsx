import { test } from "bun:test"
import { renderAm62lLpddr4Fanout } from "tests/fixtures/create-am62l-lpddr4-fanout"
import { createBgaFanoutAlgorithm } from "tests/fixtures/create-bga-fanout-algorithm"

test("routes two DDR byte buses with bga-fanout-solver", async () => {
  await renderAm62lLpddr4Fanout({
    fanoutAlgorithmFn: createBgaFanoutAlgorithm,
    fanoutSolverLabel: "@tscircuit/bga-fanout-solver",
    snapshotPath: import.meta.path,
  })
}, 300_000)
