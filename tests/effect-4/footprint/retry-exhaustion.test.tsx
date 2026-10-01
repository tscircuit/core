import { expect, spyOn, test } from "bun:test"
import { createFootprintCircuit } from "./helpers"

test("retry exhaustion emits one final legacy failure and releases the job", async () => {
  const failure = new Error("offline")
  let attempts = 0
  const circuit = createFootprintCircuit({
    maxRetries: 2,
    fetch: async () => {
      attempts++
      throw failure
    },
  })
  const errors: unknown[] = []
  circuit.on("asyncEffect:end", (event) => {
    if (event.effectName === "load-footprint-url") errors.push(event.error)
  })
  const log = spyOn(console, "error").mockImplementation(() => {})
  try {
    await circuit.renderUntilSettled()
    expect(attempts).toBe(3)
    expect(errors).toEqual([String(failure)])
    expect(circuit.db.external_footprint_load_error.list()).toHaveLength(1)
    expect(circuit.experimentalFootprintLoader!.activeJobCount).toBe(0)
    expect(circuit.getRunningAsyncEffects()).toHaveLength(0)
    expect(log).toHaveBeenCalledTimes(1)
  } finally {
    log.mockRestore()
  }
})
