import { expect, test } from "bun:test"
import { withTimeout } from "lib/utils/with-timeout"

test("withTimeout resolves with the fallback when the promise is too slow", async () => {
  const slow = new Promise((resolve) => setTimeout(() => resolve("late"), 200))
  expect(await withTimeout(slow, 10, "fallback")).toBe("fallback")
})
