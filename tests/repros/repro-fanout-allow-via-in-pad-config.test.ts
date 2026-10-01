import { expect, test } from "bun:test"
import { getPresetAutoroutingConfig } from "../../lib/utils/autorouting/getPresetAutoroutingConfig"

test("fanout preserves explicitly configured via-in-pad intent", () => {
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
