import { expect, test } from "bun:test"
import { localSkewSvg } from "tests/fixtures/local-skew/local-skew-svg"
import type { PcbTrace, SourceTrace } from "circuit-json"
import { getStoredLocalSkew } from "tests/fixtures/local-skew/get-stored-local-skew"
import { renderPairBoard } from "tests/fixtures/local-skew/pair-board"
import { segmentAtX } from "tests/fixtures/local-skew/segment-at-x"

test("a negative trace routed from its load pad still lines up", async () => {
  const circuitJson = renderPairBoard({
    positivePath: [
      { x: 2, y: 0 },
      { x: 2.5, y: 1 },
      { x: 3, y: 0 },
    ],
    negativePath: [],
    pcbTraceGap: "0.45mm",
    negativeFromLoad: true,
  })
  const negativeSource = circuitJson.find(
    (element): element is SourceTrace =>
      element.type === "source_trace" && element.name === "DN",
  )
  const negativeTrace = circuitJson.find(
    (element): element is PcbTrace =>
      element.type === "pcb_trace" &&
      element.source_trace_id === negativeSource?.source_trace_id,
  )
  const firstPoint = negativeTrace?.route[0]
  // The stored negative route really starts at the load end.
  expect(firstPoint?.route_type === "wire" && firstPoint.x).toBe(12)

  const [pair] = getStoredLocalSkew(circuitJson)

  expect(
    segmentAtX({ segments: pair.positive.segments, x: 0 }).local_skew,
  ).toBeCloseTo(1.23607, 5)
  expect(
    segmentAtX({ segments: pair.negative.segments, x: 0 }).local_skew,
  ).toBeCloseTo(-1.23607, 5)

  await expect(localSkewSvg(circuitJson)).toMatchSvgSnapshot(import.meta.path)
})
