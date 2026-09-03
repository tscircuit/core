import { test } from "bun:test"
import { checkCustomFanoutPresetHandoff } from "tests/fixtures/check-custom-fanout-preset-handoff"

test("custom fanouts above one another connect on the same layer without global vias", async () => {
  await checkCustomFanoutPresetHandoff("top", import.meta.path)
}, 30_000)
