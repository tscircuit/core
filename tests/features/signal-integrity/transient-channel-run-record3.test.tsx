import { expect, test } from "bun:test"
import { renderTransientChannelRun } from "./render-transient-channel-run"

test("PCB transient simulation writes an explicit aggressor pattern", async () => {
  const run = await renderTransientChannelRun({ aggressorPattern: " 1 " })

  expect(run.aggressor_pattern).toBe("1")
  expect(Object.hasOwn(run, "aggressor_disabled")).toBe(false)
})
