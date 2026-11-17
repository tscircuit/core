import { expect, test } from "bun:test"
import { withTimeout } from "lib/utils/with-timeout"

test("withTimeout resolves with the value when it settles in time", async () => {
  expect(await withTimeout(Promise.resolve("value"), 50, null)).toBe("value")
})
