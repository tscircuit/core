import { expect, test } from "bun:test"
import { localSkewSvg } from "tests/fixtures/local-skew/local-skew-svg"
import { getStoredLocalSkew } from "tests/fixtures/local-skew/get-stored-local-skew"
import { renderPairBoard } from "tests/fixtures/local-skew/pair-board"
import { segmentAtX } from "tests/fixtures/local-skew/segment-at-x"

test("coupling stops partway along a step where the partner drifts out of spacing", async () => {
  // DN slants from 0.70 mm to 0.98 mm away from DP between x = -10 and
  // x = 10. The 0.45 mm gap and 0.15 mm traces give a 0.72 mm main-pass
  // limit. The load pad pitch extends the reach to 0.90 mm, which the
  // traces exceed near x = 4.3.
  const circuitJson = renderPairBoard({
    positivePath: [],
    negativePath: [
      { x: 2, y: -0.1 },
      { x: 22, y: -0.38 },
    ],
    pcbTraceGap: "0.45mm",
  })
  const [pair] = getStoredLocalSkew(circuitJson)

  // Measured up to x = 4.3 (by x = 0 DN's slant has added 3.58 µm), and
  // unknown after it.
  expect(
    segmentAtX({ segments: pair.positive.segments, x: 0 }).local_skew,
  ).toBeCloseTo(-0.00358, 5)
  expect(
    segmentAtX({ segments: pair.positive.segments, x: 5 }).local_skew,
  ).toBeUndefined()

  await expect(localSkewSvg(circuitJson)).toMatchSvgSnapshot(import.meta.path)
})
