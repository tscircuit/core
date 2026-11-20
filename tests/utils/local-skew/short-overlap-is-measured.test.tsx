import { expect, test } from "bun:test"
import { localSkewSvg } from "tests/fixtures/local-skew/local-skew-svg"
import { getStoredLocalSkew } from "tests/fixtures/local-skew/get-stored-local-skew"
import { renderPairBoard } from "tests/fixtures/local-skew/pair-board"
import { segmentAtX } from "tests/fixtures/local-skew/segment-at-x"

test("a 0.02 mm stretch beside the partner is measured, not lost between samples", async () => {
  // DN leaves DP at x = -11, returns beside it only for 0 <= x <= 0.02,
  // then leaves again until just before the load.
  const circuitJson = renderPairBoard({
    positivePath: [],
    negativePath: [
      { x: 1, y: 0 },
      { x: 1, y: -3 },
      { x: 12, y: -3 },
      { x: 12, y: 0 },
      { x: 12.02, y: 0 },
      { x: 12.02, y: -3 },
      { x: 23, y: -3 },
      { x: 23, y: 0 },
    ],
    pcbTraceGap: "0.45mm",
  })
  const [pair] = getStoredLocalSkew(circuitJson)

  const short = segmentAtX({ segments: pair.positive.segments, x: 0.01 })
  expect(short.coupling).toBe("coupled")
  // DN has run 1 + 3 + 11 + 3 mm more than DP's 12 mm to reach x = 0.
  expect(short.local_skew).toBeCloseTo(-6, 5)

  await expect(localSkewSvg(circuitJson)).toMatchSvgSnapshot(import.meta.path)
})
