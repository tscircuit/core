import { expect, test } from "bun:test"
import { getStoredLocalSkew } from "tests/fixtures/local-skew/get-stored-local-skew"
import { localSkewSvg } from "tests/fixtures/local-skew/local-skew-svg"
import { renderPairBoard } from "tests/fixtures/local-skew/pair-board"

test("a coupled stretch right at the 1 nm overlap threshold finishes without hanging", async () => {
  // DN only comes beside DP for 1 nm between x = 4 and x = 4.000001, just
  // above MIN_OVERLAP because of floating-point rounding.
  const circuitJson = renderPairBoard({
    positivePath: [],
    negativePath: [
      { x: 0, y: -3 },
      { x: 16, y: -3 },
      { x: 16, y: 0 },
      { x: 16.000001, y: 0 },
      { x: 16.000001, y: -3 },
      { x: 24, y: -3 },
    ],
    pcbTraceGap: "0.45mm",
  })

  const [pair] = getStoredLocalSkew(circuitJson)

  const known = pair.positive.segments.filter(
    (segment) => segment.local_skew !== undefined,
  )
  expect(known).toHaveLength(1)
  expect(known[0].local_skew).toBeCloseTo(-6, 5)
  expect(pair.max_local_skew).toBeCloseTo(6, 5)

  await expect(localSkewSvg(circuitJson)).toMatchSvgSnapshot(import.meta.path)
}, 2000)
