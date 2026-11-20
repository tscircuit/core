import { expect, test } from "bun:test"
import { localSkewSvg } from "tests/fixtures/local-skew/local-skew-svg"
import { getStoredLocalSkew } from "tests/fixtures/local-skew/get-stored-local-skew"
import { renderPairBoard } from "tests/fixtures/local-skew/pair-board"
import { segmentAtX } from "tests/fixtures/local-skew/segment-at-x"

test("a stretch where the traces are on different layers is not coupled", async () => {
  // DN drops to the bottom layer between x = -6 and x = 6, with a 2 mm
  // detour at x = 2; DP stays on top.
  const circuitJson = renderPairBoard({
    positivePath: [],
    negativePath: [
      { x: 6, y: 0, via: true, fromLayer: "top", toLayer: "bottom" },
      { x: 14, y: 0 },
      { x: 14, y: -1 },
      { x: 16, y: -1 },
      { x: 16, y: 0 },
      { x: 18, y: 0, via: true, fromLayer: "bottom", toLayer: "top" },
    ],
    pcbTraceGap: "0.45mm",
  })
  const [pair] = getStoredLocalSkew(circuitJson)

  expect(
    segmentAtX({ segments: pair.positive.segments, x: -9 }).local_skew,
  ).toBe(0)
  // Measured, x = 0 would be the first via's 1.6 mm, before the detour.
  // Uncoupled, the skew ramps from -1.6 mm to -3.6 mm across DP's 12 mm.
  expect(
    segmentAtX({ segments: pair.positive.segments, x: 0 }).local_skew,
  ).toBeCloseTo(-2.6, 2)

  await expect(localSkewSvg(circuitJson)).toMatchSvgSnapshot(import.meta.path)
})
