import { expect, test } from "bun:test"
import { getStoredLocalSkew } from "tests/fixtures/local-skew/get-stored-local-skew"
import { localSkewSvg } from "tests/fixtures/local-skew/local-skew-svg"
import { renderPairBoard } from "tests/fixtures/local-skew/pair-board"
import { segmentAtX } from "tests/fixtures/local-skew/segment-at-x"

test("a via right after the last coupled run still counts toward the maximum", async () => {
  // DP runs straight on top; DN drops to bottom at x = -6, returns to top at
  // x = 10, and jogs 2 mm away so it never recouples. The coupled run on
  // [-12, -6] has zero skew, but DN's asymmetric ending via at x = -6 adds
  // a known 1.6 mm step right after the run.
  const circuitJson = renderPairBoard({
    positivePath: [],
    negativePath: [
      { x: 6, y: 0, via: true, fromLayer: "top", toLayer: "bottom" },
      { x: 22, y: 0, via: true, fromLayer: "bottom", toLayer: "top" },
      { x: 22, y: -2 },
      { x: 24, y: -2 },
    ],
    pcbTraceGap: "0.45mm",
  })

  const [pair] = getStoredLocalSkew(circuitJson)

  const before = segmentAtX({ segments: pair.positive.segments, x: -9 })
  const after = segmentAtX({ segments: pair.positive.segments, x: 0 })
  expect(before.local_skew).toBe(0)
  expect(after.local_skew).toBeUndefined()
  expect(pair.max_local_skew).toBeCloseTo(1.6, 5)

  await expect(localSkewSvg(circuitJson)).toMatchSvgSnapshot(import.meta.path)
})
