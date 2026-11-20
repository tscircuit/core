import { expect, test } from "bun:test"
import { getStoredLocalSkew } from "tests/fixtures/local-skew/get-stored-local-skew"
import { localSkewSvg } from "tests/fixtures/local-skew/local-skew-svg"
import { renderPairBoard } from "tests/fixtures/local-skew/pair-board"
import { segmentAtX } from "tests/fixtures/local-skew/segment-at-x"

/** Extra copper added by the 0.5 µm triangular jog (~0.00041 mm, below 0.0005 mm). */
const JOG_EXTRA_LENGTH = 2 * Math.hypot(0.0005, 0.0005) - 0.001

test("a sub-micron jog retains its signed skew in Circuit JSON", async () => {
  // DP takes a 0.5 µm jog at x = -2, adding ~0.00041 mm of copper. The 14 mm
  // coupled run after the jog retains that skew to within 10 nm.
  const circuitJson = renderPairBoard({
    positivePath: [
      { x: 10, y: 0 },
      { x: 10.0005, y: 0.0005 },
      { x: 10.001, y: 0 },
    ],
    negativePath: [],
    pcbTraceGap: "0.45mm",
  })

  const [pair] = getStoredLocalSkew(circuitJson)
  expect(pair.max_local_skew).toBeCloseTo(JOG_EXTRA_LENGTH, 5)

  const positiveAfter = segmentAtX({ segments: pair.positive.segments, x: 5 })
  const negativeAfter = segmentAtX({ segments: pair.negative.segments, x: 5 })
  expect(positiveAfter.coupling).toBe("coupled")
  expect(positiveAfter.local_skew).toBeCloseTo(JOG_EXTRA_LENGTH, 5)
  expect(negativeAfter.local_skew).toBeCloseTo(-JOG_EXTRA_LENGTH, 5)

  await expect(localSkewSvg(circuitJson)).toMatchSvgSnapshot(import.meta.path)
})
