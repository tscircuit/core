import { expect, test } from "bun:test"
import { localSkewSvg } from "tests/fixtures/local-skew/local-skew-svg"
import { getStoredLocalSkew } from "tests/fixtures/local-skew/get-stored-local-skew"
import { renderPairBoard } from "tests/fixtures/local-skew/pair-board"
import { segmentAtX } from "tests/fixtures/local-skew/segment-at-x"

test("a nearer pass that doubles back doesn't displace the passes in route order", async () => {
  // DN runs 0.6 mm below DP from x = -12 to 0, dips 2 mm away until x = 1,
  // and runs beside DP again to x = 10. It then loops back and passes
  // x = -12..0 again, just 0.5 mm above DP in the same direction, before
  // going round the load pads to its own.
  const circuitJson = renderPairBoard({
    positivePath: [],
    negativePath: [
      { x: 12, y: 0 },
      { x: 12, y: -2 },
      { x: 13, y: -2 },
      { x: 13, y: 0 },
      { x: 22, y: 0 },
      { x: 22, y: -3 },
      { x: -2, y: -3 },
      { x: -2, y: 1.1 },
      { x: 12, y: 1.1 },
      { x: 12, y: 4 },
      { x: 26, y: 4 },
      { x: 26, y: 0 },
    ],
    pcbTraceGap: "0.45mm",
  })
  const [pair] = getStoredLocalSkew(circuitJson)

  // Both passes in route order are measured: in step before the dip, DN
  // 4 mm longer after it.
  const first = segmentAtX({ segments: pair.positive.segments, x: -6 })
  const second = segmentAtX({ segments: pair.positive.segments, x: 5 })
  expect(first.coupling).toBe("coupled")
  expect(first.local_skew).toBe(0)
  expect(second.coupling).toBe("coupled")
  expect(second.local_skew).toBeCloseTo(-4, 5)

  await expect(localSkewSvg(circuitJson)).toMatchSvgSnapshot(import.meta.path)
})
