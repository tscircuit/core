import { expect, test } from "bun:test"
import { createTestPointAutorouter } from "./fixture"

test("stopping test-point autorouting prevents subsequent target searches and completion", async () => {
  const router = createTestPointAutorouter()
  let steps = 0
  let completed = false
  router.on("complete", () => {
    completed = true
  })
  await new Promise<void>((resolve, reject) => {
    router.on("error", ({ error }) => reject(error))
    router.on("progress", (event) => {
      steps = event.steps
      router.stop()
      setTimeout(resolve, 10)
    })
    router.start()
  })
  expect(steps).toBe(1)
  expect(completed).toBe(false)
  expect(router.isRouting).toBe(false)
  expect(() => router.getTestPoints()).toThrow("has not solved")
})
