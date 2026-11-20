import { expect, test } from "bun:test"
import { localSkewSvg } from "tests/fixtures/local-skew/local-skew-svg"
import { getStoredLocalSkew } from "tests/fixtures/local-skew/get-stored-local-skew"
import { DETOUR_EXTRA_LENGTH } from "tests/fixtures/local-skew/differential-pair-board"
import { renderPairBoard } from "tests/fixtures/local-skew/pair-board"
import { segmentAtX } from "tests/fixtures/local-skew/segment-at-x"

test("a negative trace routed from its load across two vias keeps its layers and distances", async () => {
  // Both traces hop to the bottom layer between x = -6 and x = 6. DP also
  // detours right after its source. DN is routed from its load end.
  const circuitJson = renderPairBoard({
    positivePath: [
      { x: 2, y: 0 },
      { x: 2.5, y: 1 },
      { x: 3, y: 0 },
      { x: 6, y: 0, via: true, fromLayer: "top", toLayer: "bottom" },
      { x: 18, y: 0, via: true, fromLayer: "bottom", toLayer: "top" },
    ],
    negativePath: [
      { x: -6, y: 0, via: true, fromLayer: "top", toLayer: "bottom" },
      { x: -18, y: 0, via: true, fromLayer: "bottom", toLayer: "top" },
    ],
    pcbTraceGap: "0.45mm",
    negativeFromLoad: true,
  })
  const [pair] = getStoredLocalSkew(circuitJson)

  for (const x of [-3, 3]) {
    const positive = segmentAtX({ segments: pair.positive.segments, x })
    const negative = segmentAtX({ segments: pair.negative.segments, x })
    expect(positive.layer).toBe("bottom")
    expect(negative.layer).toBe("bottom")
    expect(positive.local_skew).toBeCloseTo(DETOUR_EXTRA_LENGTH, 5)
    expect(negative.local_skew).toBeCloseTo(-DETOUR_EXTRA_LENGTH, 5)
  }
  expect(segmentAtX({ segments: pair.negative.segments, x: 9 }).layer).toBe(
    "top",
  )

  await expect(localSkewSvg(circuitJson)).toMatchSvgSnapshot(import.meta.path)
})
