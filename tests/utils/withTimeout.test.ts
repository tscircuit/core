import { expect, test } from "bun:test"
import { withTimeout } from "lib/utils/withTimeout"

test("withTimeout resolves with the value when it settles in time", async () => {
  expect(await withTimeout(Promise.resolve("value"), 50, null)).toBe("value")
})

test("withTimeout resolves with the fallback when the promise is too slow", async () => {
  const slow = new Promise((resolve) => setTimeout(() => resolve("late"), 200))
  expect(await withTimeout(slow, 10, "fallback")).toBe("fallback")
})

test("withTimeout passes through rejections that happen in time", async () => {
  await expect(
    withTimeout(Promise.reject(new Error("boom")), 50, null),
  ).rejects.toThrow("boom")
})
