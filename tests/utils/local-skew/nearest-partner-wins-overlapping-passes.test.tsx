import { expect, test } from "bun:test"
import { localSkewSvg } from "tests/fixtures/local-skew/local-skew-svg"
import { getStoredLocalSkew } from "tests/fixtures/local-skew/get-stored-local-skew"
import { renderPairBoard } from "tests/fixtures/local-skew/pair-board"
import { segmentAtX } from "tests/fixtures/local-skew/segment-at-x"

/** Extra length the negative trace runs while doubling back, in mm. */
const DOUBLE_BACK_LENGTH = 0.3 + 6 + 0.3 + 6

test("when the negative trace passes the positive one twice, the nearer pass is used", async () => {
  // DN runs beside DP to x = 2, doubles back to x = -4, then runs beside DP
  // again 0.6 mm farther out. Both passes are within the 1 mm gap.
  const circuitJson = renderPairBoard({
    positivePath: [],
    negativePath: [
      { x: 14, y: 0 },
      { x: 14, y: -0.3 },
      { x: 8, y: -0.3 },
      { x: 8, y: -0.6 },
      { x: 24, y: -0.6 },
      { x: 24, y: 0 },
    ],
    pcbTraceGap: "1mm",
  })
  const [pair] = getStoredLocalSkew(circuitJson)

  const segments = pair.positive.segments
  expect(segmentAtX({ segments, x: 0 }).local_skew).toBe(0)
  expect(segmentAtX({ segments, x: 8 }).local_skew).toBeCloseTo(
    -DOUBLE_BACK_LENGTH,
    5,
  )
  // Where both passes are within the gap, DP is still matched only once.
  const coveringX0 = segments.filter(
    (segment) => segment.start.x <= 0 && segment.end.x >= 0,
  )
  expect(coveringX0).toHaveLength(1)
  for (const segment of segments) {
    if (segment.local_skew === undefined) continue
    expect(segment.local_skew).toBeLessThanOrEqual(0)
    expect(segment.local_skew).toBeGreaterThanOrEqual(
      -DOUBLE_BACK_LENGTH - 1e-5,
    )
  }

  await expect(localSkewSvg(circuitJson)).toMatchSvgSnapshot(import.meta.path)
})
