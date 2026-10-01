import { test } from "bun:test"
import { renderAm62lLpddr4Fanout } from "tests/fixtures/create-am62l-lpddr4-fanout"

// Keep the full-board native fanout benchmark separate from the custom BGA
// callback contract in autorouter-fanout-custom-bga.test.tsx.
test("routes two DDR byte buses through the native fanout pipeline", async () => {
  await renderAm62lLpddr4Fanout({
    snapshotPath: import.meta.path,
  })
}, 300_000)
