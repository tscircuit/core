import { expect, test } from "bun:test"
import { renderTransientChannelRun } from "./render-transient-channel-run"

test("PCB transient simulation writes both aggressor controls", async () => {
  const run = await renderTransientChannelRun({
    aggressorPattern: "prbs15",
    aggressorDisabled: true,
  })

  expect(run.aggressor_pattern).toBe("prbs15")
  expect(run.aggressor_disabled).toBe(true)
})
