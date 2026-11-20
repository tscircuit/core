import { expect, test } from "bun:test"
import { localSkewSvg } from "tests/fixtures/local-skew/local-skew-svg"
import { getStoredLocalSkew } from "tests/fixtures/local-skew/get-stored-local-skew"
import { renderPairBoard } from "tests/fixtures/local-skew/pair-board"

test("a run with constant skew is one segment, not one per sample", async () => {
  // An asymmetric detour leaves a constant skew whose two ends differ in
  // the last bits of floating point.
  const circuitJson = renderPairBoard({
    positivePath: [
      { x: 2, y: 0 },
      { x: 2.3, y: 0.7 },
      { x: 3.1, y: 0 },
    ],
    negativePath: [],
    pcbTraceGap: "0.45mm",
  })
  const [pair] = getStoredLocalSkew(circuitJson)

  const afterDetour = pair.positive.segments.filter(
    (segment) => segment.start.y === 0.3 && segment.start.x >= -8.9,
  )
  expect(afterDetour).toHaveLength(1)
  expect(afterDetour[0].end.x).toBeCloseTo(12, 9)

  await expect(localSkewSvg(circuitJson)).toMatchSvgSnapshot(import.meta.path)
})
