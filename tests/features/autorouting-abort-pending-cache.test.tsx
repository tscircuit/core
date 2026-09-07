import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { abortableDelay } from "lib/utils/abortable-delay"

test("a cache result received after cancellation cannot start or complete routing", async () => {
  const requested = Promise.withResolvers<void>()
  const cacheResult = Promise.withResolvers<string>()
  const { circuit } = getTestFixture({
    platform: {
      localCacheEngine: {
        getItem: (key) => {
          if (!key.startsWith("routes:")) return null
          requested.resolve()
          return cacheResult.promise
        },
        setItem: () => {},
      },
    },
  })
  const reason = new Error("Cancel pending routing cache lookup")
  const events: string[] = []
  circuit.on("autorouting:start", () => events.push("start"))
  circuit.on("autorouting:end", () => events.push("end"))
  circuit.on("autorouting:error", () => events.push("error"))
  circuit.on("solver:started", () => events.push("solver"))
  circuit.add(
    <board width={16} height={12}>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={5} />
      <trace from="R1.pin1" to="R2.pin1" />
    </board>,
  )
  const rendering = circuit.renderUntilSettled()
  await requested.promise
  events.length = 0
  circuit.cancelRendering(reason)
  await expect(rendering).rejects.toBe(reason)
  cacheResult.resolve(JSON.stringify({ traces: [] }))
  await abortableDelay(0)
  expect(events).toEqual([])
  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(0)
  expect(circuit.db.pcb_trace.list()).toHaveLength(0)
})
