import { expect, test } from "bun:test"
import { localSkewSvg } from "tests/fixtures/local-skew/local-skew-svg"
import { getStoredLocalSkew } from "tests/fixtures/local-skew/get-stored-local-skew"
import { renderPairBoard } from "tests/fixtures/local-skew/pair-board"

/** How far DN's corners sit along the route from DP's on a 45° bend, 0.6 mm apart. */
const CORNER_SHIFT = 0.6 * Math.tan(Math.PI / 8)

test("45° corners at non-round coordinates leave no near-zero-length segments", async () => {
  // Both traces jog up 0.7 mm at 45° and back down.
  const circuitJson = renderPairBoard({
    positivePath: [
      { x: 8, y: 0 },
      { x: 8.7, y: 0.7 },
      { x: 15.3, y: 0.7 },
      { x: 16, y: 0 },
    ],
    negativePath: [
      { x: 8 + CORNER_SHIFT, y: 0 },
      { x: 8.7 + CORNER_SHIFT, y: 0.7 },
      { x: 15.3 - CORNER_SHIFT, y: 0.7 },
      { x: 16 - CORNER_SHIFT, y: 0 },
    ],
    pcbTraceGap: "0.45mm",
  })
  const [pair] = getStoredLocalSkew(circuitJson)

  for (const segment of [
    ...pair.positive.segments,
    ...pair.negative.segments,
  ]) {
    expect(
      Math.hypot(
        segment.end.x - segment.start.x,
        segment.end.y - segment.start.y,
      ),
    ).toBeGreaterThan(1e-6)
  }

  await expect(localSkewSvg(circuitJson)).toMatchSvgSnapshot(import.meta.path)
})
