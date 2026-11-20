import { expect, test } from "bun:test"
import { localSkewSvg } from "tests/fixtures/local-skew/local-skew-svg"
import { getStoredLocalSkew } from "tests/fixtures/local-skew/get-stored-local-skew"
import { renderPairBoard } from "tests/fixtures/local-skew/pair-board"
import { segmentAtX } from "tests/fixtures/local-skew/segment-at-x"

test("the spacing allowance uses the mean of the two trace widths", async () => {
  // DP is 0.45 mm wide, DN 0.15 mm, gap 0.25 mm: the traces count as
  // coupled up to (0.25 + 0.3) * 1.2 = 0.66 mm apart. They start 0.6 mm
  // apart, and DN moves to 0.7 mm between x = -6 and x = 6.
  const circuitJson = renderPairBoard({
    positivePath: [],
    negativePath: [
      { x: 6, y: 0 },
      { x: 6, y: -0.1 },
      { x: 18, y: -0.1 },
      { x: 18, y: 0 },
    ],
    pcbTraceGap: "0.25mm",
    positiveThickness: "0.45mm",
  })
  const [pair] = getStoredLocalSkew(circuitJson)

  const beside = segmentAtX({ segments: pair.positive.segments, x: -9 })
  expect(beside.local_skew).toBe(0)
  expect(beside.width).toBe(0.45)
  // Measured, DN would already be 0.1 mm ahead from its first jog at x = -6.
  // Uncoupled, the 0.2 mm the two jogs add ramps in over DP's 12 mm.
  expect(
    segmentAtX({ segments: pair.positive.segments, x: -3 }).local_skew,
  ).toBeCloseTo(-0.05, 2)

  await expect(localSkewSvg(circuitJson)).toMatchSvgSnapshot(import.meta.path)
})
