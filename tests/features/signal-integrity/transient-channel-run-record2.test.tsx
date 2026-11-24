import { expect, test } from "bun:test"
import { renderTransientChannelRun } from "./render-transient-channel-run"

test("PCB transient simulation omits undeclared aggressor controls", async () => {
  const run = await renderTransientChannelRun({})

  expect(Object.hasOwn(run, "aggressor_pattern")).toBe(false)
  expect(Object.hasOwn(run, "aggressor_disabled")).toBe(false)
})
