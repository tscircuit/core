import { expect, test } from "bun:test"
import { createTestPointAutorouter } from "./fixture"

test("test-point autorouter yields between targets and completes with unchanged input", async () => {
  const router = createTestPointAutorouter()
  const before = structuredClone(router.input)
  const events: string[] = []
  router.on("progress", ({ steps }) => {
    events.push(`step${steps}`)
    queueMicrotask(() => events.push("yield"))
  })
  const done = new Promise<void>((resolve, reject) => {
    router.on("error", ({ error }) => reject(error))
    router.on("complete", ({ traces }) => {
      events.push("complete")
      expect(traces).toHaveLength(2)
      resolve()
    })
  })
  router.start()
  expect(events).toEqual([])
  await done
  expect(events).toEqual(["step1", "yield", "step2", "yield", "complete"])
  expect(router.getTestPoints()).toHaveLength(2)
  expect(router.input).toEqual(before)
  expect(router.isRouting).toBe(false)
})
