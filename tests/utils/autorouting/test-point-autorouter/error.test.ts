import { expect, test } from "bun:test"
import { createTestPointAutorouter } from "./fixture"

test("impossible test-point placement emits an async error without partial output", async () => {
  const router = createTestPointAutorouter(true)
  let completed = false
  router.on("complete", () => {
    completed = true
  })
  const error = await new Promise<Error>((resolve) => {
    router.on("error", ({ error }) => resolve(error))
    router.start()
  })
  expect(error.message).toContain("No clearance-safe test point placement")
  expect(completed).toBe(false)
  expect(router.isRouting).toBe(false)
  expect(() => router.getTestPoints()).toThrow("has not solved")
})
