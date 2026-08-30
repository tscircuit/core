import { test } from "bun:test"
import { renderAm62lLpddr4Fanout } from "tests/fixtures/create-am62l-lpddr4-fanout"
import { createBgaFanoutAlgorithm } from "tests/fixtures/create-bga-fanout-algorithm"

// This now reaches FixedTargetBgaFanoutSolver instead of silently falling back
// to Core's built-in fanout solver. Keep it as an expected failure until the
// fixed-target solver completes this fixture within its iteration budget; the
// previous snapshot was removed because it depicted the fallback solver.
test.failing(
  "routes two DDR byte buses with bga-fanout-solver",
  async () => {
    await renderAm62lLpddr4Fanout({
      fanoutAlgorithmFn: createBgaFanoutAlgorithm,
      fanoutSolverLabel: "@tscircuit/bga-fanout-solver",
      snapshotPath: import.meta.path,
    })
  },
  300_000,
)
