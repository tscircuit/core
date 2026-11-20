import { expect, test } from "bun:test"
import { localSkewSvg } from "tests/fixtures/local-skew/local-skew-svg"
import { getStoredLocalSkew } from "tests/fixtures/local-skew/get-stored-local-skew"
import { renderPairBoard } from "tests/fixtures/local-skew/pair-board"
import { segmentAtX } from "tests/fixtures/local-skew/segment-at-x"

test("without pcbTraceGap the pair is still coupled at its routed spacing", async () => {
  const circuitJson = renderPairBoard({ positivePath: [], negativePath: [] })
  const [pair] = getStoredLocalSkew(circuitJson)

  const middle = segmentAtX({ segments: pair.positive.segments, x: 0 })
  expect(middle.local_skew).toBe(0)

  await expect(localSkewSvg(circuitJson)).toMatchSvgSnapshot(import.meta.path)
})
