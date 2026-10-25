import "../fixtures/extend-expect-circuit-snapshot"
import { expect, test } from "bun:test"
import { getLazyProgressGraphicsFixture } from "../fixtures/get-lazy-progress-graphics-fixture"
test("interactive progress consumers retain graphics and reuse one preview per event", async () => {
  const result = await getLazyProgressGraphicsFixture(true)
  await expect(result.circuit).toMatchPcbSnapshot(import.meta.path)
  expect(result.traces).toHaveLength(1)
  expect(result.errors).toHaveLength(0)
  expect(result.progress.length).toBeGreaterThan(0)
  expect(result.previews.count).toBe(result.progress.length)
  expect(result.graphicReads.every(read => read.sameObject)).toBe(true)
})
