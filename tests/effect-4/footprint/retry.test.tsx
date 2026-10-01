import { expect, test } from "bun:test"
import { createFootprintCircuit, footprintResponse } from "./helpers"

test("bounded opt-in retries close HTTP error bodies and commit once after transient failures", async () => {
  let attempts = 0
  let closedErrorBodies = 0
  const circuit = createFootprintCircuit({
    maxRetries: 2,
    fetch: async () => {
      attempts++
      if (attempts === 1) {
        return new Response(
          new ReadableStream({
            cancel() {
              closedErrorBodies++
            },
          }),
          { status: 503 },
        )
      }
      if (attempts === 2) throw new TypeError("temporary network failure")
      return footprintResponse()
    },
  })
  const events: string[] = []
  circuit.on("asyncEffect:start", (event) => {
    if (event.effectName === "load-footprint-url") events.push(event.effectName)
  })
  circuit.on("asyncEffect:end", (event) => {
    if (event.effectName === "load-footprint-url") events.push(event.effectName)
  })
  await circuit.renderUntilSettled()
  expect(attempts).toBe(3)
  expect(closedErrorBodies).toBe(1)
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(2)
  expect(circuit.db.external_footprint_load_error.list()).toHaveLength(0)
  expect(events).toEqual(["load-footprint-url", "load-footprint-url"])
  expect(circuit.experimentalFootprintLoader!.activeJobCount).toBe(0)
})
