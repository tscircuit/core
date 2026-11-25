import { expect, test } from "bun:test"
import { renderTransientChannelRun } from "./render-transient-channel-run"

test("PCB transient simulation preserves an explicit false aggressor flag", async () => {
  const run = await renderTransientChannelRun({ aggressorDisabled: false })

  expect(run.aggressor_disabled).toBe(false)
  expect(Object.hasOwn(run, "aggressor_pattern")).toBe(false)
})
