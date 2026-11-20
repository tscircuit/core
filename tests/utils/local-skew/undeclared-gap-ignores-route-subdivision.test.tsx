import { expect, test } from "bun:test"
import { localSkewSvg } from "tests/fixtures/local-skew/local-skew-svg"
import { getStoredLocalSkew } from "tests/fixtures/local-skew/get-stored-local-skew"
import {
  type PairPathPoint,
  renderPairBoard,
} from "tests/fixtures/local-skew/pair-board"

/**
 * DN runs 2 mm below DP between x = -11 and x = 11. Both routes get extra
 * collinear points every `step` mm.
 */
function renderFarPair({ step }: { step: number }) {
  const positivePath: PairPathPoint[] = []
  const negativeAlong: PairPathPoint[] = []
  for (let x = step; x < 24; x += step) positivePath.push({ x, y: 0 })
  for (let x = 1 + step; x < 23; x += step) negativeAlong.push({ x, y: -1.4 })
  return renderPairBoard({
    positivePath,
    negativePath: [
      { x: 1, y: 0 },
      { x: 1, y: -1.4 },
      ...negativeAlong,
      { x: 23, y: -1.4 },
      { x: 23, y: 0 },
    ],
  })
}

test("without pcbTraceGap, splitting a route into more points doesn't change coupling", async () => {
  // 2 mm apart is beyond ten trace widths, so the far stretch never couples,
  // whether DN is one 22 mm step or 22 steps of 1 mm.
  expect(getStoredLocalSkew(renderFarPair({ step: 1 }))).toEqual(
    getStoredLocalSkew(renderFarPair({ step: 30 })),
  )
  const circuitJson = renderFarPair({ step: 1 })
  const [pair] = getStoredLocalSkew(circuitJson)
  const middle = pair.positive.segments.find(
    (segment) => segment.start.x <= 0 && segment.end.x >= 0,
  )
  // The 2.8 mm DN adds at its ends ramps in across the far stretch.
  expect(middle?.local_skew).toBeCloseTo(-1.4, 1)
  await expect(localSkewSvg(circuitJson)).toMatchSvgSnapshot(import.meta.path)
})
