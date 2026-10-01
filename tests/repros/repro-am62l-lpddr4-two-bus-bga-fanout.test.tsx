import { expect, mock, test } from "bun:test"
import { renderAm62lLpddr4Fanout } from "tests/fixtures/create-am62l-lpddr4-fanout"
import { createBgaFanoutAlgorithm } from "tests/fixtures/create-bga-fanout-algorithm"

test("routes two DDR byte buses with bga-fanout-solver", async () => {
  const fanoutAlgorithmFn = mock(createBgaFanoutAlgorithm)
  await renderAm62lLpddr4Fanout({
    fanoutAlgorithmFn,
    // Keep dense BGA escapes on separate routing layers.
    signalOnlyBoardLayerCount: 8,
    snapshotPath: import.meta.path,
  })
  expect(fanoutAlgorithmFn).toHaveBeenCalledTimes(2)
}, 300_000)
