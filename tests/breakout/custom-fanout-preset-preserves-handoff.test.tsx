import { test } from "bun:test"
import { checkCustomFanoutPresetHandoff } from "tests/fixtures/check-custom-fanout-preset-handoff"

test("custom fanout algorithms retain preset handoff and paired target layers", async () => {
  await checkCustomFanoutPresetHandoff("right", import.meta.path)
}, 30_000)
