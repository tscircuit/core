import { expect, test } from "bun:test"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getPresetAutoroutingConfig } from "../../lib/utils/autorouting/getPresetAutoroutingConfig"

test("fanout preserves via-in-pad intent and custom algorithms", () => {
  const algorithmFn = createBasicAutorouter(async () => [])
  const customConfig = getPresetAutoroutingConfig({
    preset: "fanout",
    allowViaInPad: true,
    algorithmFn,
  })
  expect(customConfig.algorithmFn).toBe(algorithmFn)
  expect(
    getPresetAutoroutingConfig({ preset: "fanout", allowViaInPad: true }),
  ).toMatchObject({
    preset: "fanout",
    local: true,
    groupMode: "subcircuit",
    allowViaInPad: true,
  })
  expect(
    getPresetAutoroutingConfig({ preset: "fanout", allowViaInPad: false })
      .allowViaInPad,
  ).toBe(false)
  expect(getPresetAutoroutingConfig("fanout").allowViaInPad).toBeUndefined()
})
