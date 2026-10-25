import "../fixtures/extend-expect-circuit-snapshot"
import { expect, test } from "bun:test"
import { getLazyProgressGraphicsFixture } from "../fixtures/get-lazy-progress-graphics-fixture"
test("native routing metrics do not render unused debug previews through Group forwarding", async () => {
  const result = await getLazyProgressGraphicsFixture()
  await expect(result.circuit).toMatchPcbSnapshot(import.meta.path)
  expect(result.traces).toHaveLength(1)
  expect(result.errors).toHaveLength(0)
  expect(result.progress.length).toBeGreaterThan(0)
  expect(result.previews.count).toBe(0)
})
