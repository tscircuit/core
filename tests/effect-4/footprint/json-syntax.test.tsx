import { expect, spyOn, test } from "bun:test"
import { createFootprintCircuit } from "./helpers"

test("JSON body decode failures are not retried", async () => {
  let attempts = 0
  const circuit = createFootprintCircuit({
    maxRetries: 2,
    fetch: async () => {
      attempts++
      return new Response("{bad json")
    },
  })
  const errors: unknown[] = []
  circuit.on("asyncEffect:end", (event) => {
    if (event.effectName === "load-footprint-url") errors.push(event.error)
  })
  const log = spyOn(console, "error").mockImplementation(() => {})
  try {
    await circuit.renderUntilSettled()
    expect(attempts).toBe(1)
    expect(errors).toHaveLength(1)
    expect(String(errors[0])).toContain("SyntaxError")
    expect(circuit.db.external_footprint_load_error.list()).toHaveLength(1)
    expect(circuit.experimentalFootprintLoader!.activeJobCount).toBe(0)
  } finally {
    log.mockRestore()
  }
})
