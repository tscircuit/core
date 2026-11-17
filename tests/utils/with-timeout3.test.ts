import { expect, test } from "bun:test"
import { withTimeout } from "lib/utils/withTimeout"

test("withTimeout passes through rejections that happen in time", async () => {
  await expect(
    withTimeout(Promise.reject(new Error("boom")), 50, null),
  ).rejects.toThrow("boom")
})
