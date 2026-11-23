import { expect, test } from "bun:test"
import { renderTransientChannelRun } from "./render-transient-channel-run"

test("PCB transient simulation writes an explicit high-impedance request", async () => {
  const run = await renderTransientChannelRun({ aggressorDisabled: true })

  expect(run.aggressor_disabled).toBe(true)
  expect(Object.hasOwn(run, "aggressor_pattern")).toBe(false)
})
