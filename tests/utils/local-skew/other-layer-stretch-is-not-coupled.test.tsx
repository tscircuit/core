import { expect, test } from "bun:test"
import { localSkewSvg } from "tests/fixtures/local-skew/local-skew-svg"
import { getStoredLocalSkew } from "tests/fixtures/local-skew/get-stored-local-skew"
import { renderPairBoard } from "tests/fixtures/local-skew/pair-board"
import { segmentAtX } from "tests/fixtures/local-skew/segment-at-x"

test("a stretch where the traces are on different layers is not coupled", async () => {
  // DN drops to the bottom layer between x = -6 and x = 6; DP stays on top.
  const circuitJson = renderPairBoard({
    positivePath: [],
    negativePath: [
      { x: 6, y: 0, via: true, fromLayer: "top", toLayer: "bottom" },
      { x: 18, y: 0, via: true, fromLayer: "bottom", toLayer: "top" },
    ],
    pcbTraceGap: "0.45mm",
  })
  const [pair] = getStoredLocalSkew(circuitJson)

  expect(segmentAtX({ segments: pair.positive.segments, x: -9 }).coupling).toBe(
    "coupled",
  )
  expect(segmentAtX({ segments: pair.positive.segments, x: 0 }).coupling).toBe(
    "interpolated",
  )

  await expect(localSkewSvg(circuitJson)).toMatchSvgSnapshot(import.meta.path)
})
