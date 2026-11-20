import { expect, test } from "bun:test"
import { localSkewSvg } from "tests/fixtures/local-skew/local-skew-svg"
import { getStoredLocalSkew } from "tests/fixtures/local-skew/get-stored-local-skew"
import { renderPairBoard } from "tests/fixtures/local-skew/pair-board"
import { segmentAtX } from "tests/fixtures/local-skew/segment-at-x"

/** How far DN drops over its 20 mm slant: 2°, just past the 0.8° parallel limit. */
const SLANT_DROP = 20 * Math.tan((2 * Math.PI) / 180)

test("a partner angled 2° away is not coupled, even within the spacing", async () => {
  // DN slants away from x = -11 to 9; its first 3.4 mm stay within the
  // 0.72 mm spacing allowance.
  const circuitJson = renderPairBoard({
    positivePath: [],
    negativePath: [
      { x: 1, y: 0 },
      { x: 21, y: -SLANT_DROP },
      { x: 21, y: 0 },
    ],
    pcbTraceGap: "0.45mm",
  })
  const [pair] = getStoredLocalSkew(circuitJson)

  expect(
    segmentAtX({ segments: pair.positive.segments, x: -11.5 }).local_skew,
  ).toBe(0)
  // Measured, x = -10 would be almost 0. Uncoupled, the 0.71 mm DN adds
  // ramps in over the 20 mm slant.
  expect(
    segmentAtX({ segments: pair.positive.segments, x: -10 }).local_skew,
  ).toBeCloseTo(-0.035, 2)

  await expect(localSkewSvg(circuitJson)).toMatchSvgSnapshot(import.meta.path)
})
