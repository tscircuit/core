import { expect, test } from "bun:test"
import { localSkewSvg } from "tests/fixtures/local-skew/local-skew-svg"
import type { PcbTrace } from "circuit-json"
import { getStoredLocalSkew } from "tests/fixtures/local-skew/get-stored-local-skew"
import { renderPairBoard } from "tests/fixtures/local-skew/pair-board"
import { segmentAtX } from "tests/fixtures/local-skew/segment-at-x"

test("each via adds the same length to skew as to trace_length", async () => {
  // Both traces take the same path, but DN hops to the bottom layer and
  // back between x = -6 and x = 6.
  const circuitJson = renderPairBoard({
    positivePath: [],
    negativePath: [
      { x: 6, y: 0, via: true, fromLayer: "top", toLayer: "bottom" },
      { x: 18, y: 0, via: true, fromLayer: "bottom", toLayer: "top" },
    ],
    pcbTraceGap: "0.45mm",
  })
  const [positiveLength, negativeLength] = circuitJson
    .filter((element): element is PcbTrace => element.type === "pcb_trace")
    .map((trace) => trace.trace_length ?? Number.NaN)

  const [pair] = getStoredLocalSkew(circuitJson)

  const before = segmentAtX({ segments: pair.positive.segments, x: -9 })
  const after = segmentAtX({ segments: pair.positive.segments, x: 9 })
  expect(before.coupling).toBe("coupled")
  expect(before.local_skew).toBe(0)
  expect(after.coupling).toBe("coupled")
  expect(after.local_skew).toBeCloseTo(positiveLength - negativeLength, 5)
  expect(after.local_skew).toBeLessThan(0)

  await expect(localSkewSvg(circuitJson)).toMatchSvgSnapshot(import.meta.path)
})
