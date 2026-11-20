import { expect, test } from "bun:test"
import type { PcbTrace } from "circuit-json"
import { getStoredLocalSkew } from "tests/fixtures/local-skew/get-stored-local-skew"
import { localSkewSvg } from "tests/fixtures/local-skew/local-skew-svg"
import { renderPairBoard } from "tests/fixtures/local-skew/pair-board"
import { segmentAtX } from "tests/fixtures/local-skew/segment-at-x"

/** Extra copper DP adds in its detour near the load pads: 2 * 2.2225 mm. */
const DETOUR_EXTRA_LENGTH = 4.445

// Geometry check inspired by KiCad QA tests `DRCLengths` (`time_calculations` CLASS7 in test_drc_lengths.cpp) and `DRCFalsePositiveRegressions` (`issue7975` in test_drc_regressions.cpp); dimensions and expected values are our own.
test("a detour where the pair widens to pad pitch shows as skew, measured at the pad pitch", async () => {
  // The pair fans in from 0.6 mm pad pitch to 0.3 mm over x in [-9.85, 4.0], within
  // (0.15 + 0.15) * 1.2 = 0.36 mm of the declared gap. Like KiCad, the stretches at pad
  // pitch before the first and after the last run are matched against the pads' centre
  // distance instead: 0.6 * 1.2 = 0.72 mm, so they couple too.
  // DP's vertical loop (x in [6, 8], 2.8 mm from DN at its top) doesn't couple, so skew
  // ramps across it from 0 to the loop's 4.445 mm and stays there to the load.
  const circuitJson = renderPairBoard({
    positivePath: [
      { x: 2, y: 0 },
      { x: 2.15, y: -0.15 },
      { x: 16, y: -0.15 },
      { x: 16.15, y: 0 },
      { x: 18, y: 0 },
      { x: 18, y: 2.2225 },
      { x: 20, y: 2.2225 },
      { x: 20, y: 0 },
    ],
    negativePath: [
      { x: 2, y: 0 },
      { x: 2.15, y: 0.15 },
      { x: 16, y: 0.15 },
      { x: 16.15, y: 0 },
    ],
    pcbTraceGap: "0.15mm",
  })
  const [pair] = getStoredLocalSkew(circuitJson)

  const traces = circuitJson.filter(
    (element): element is PcbTrace => element.type === "pcb_trace",
  )
  const positiveTrace = traces.find(
    (trace) => trace.pcb_trace_id === pair.positive.pcb_trace_id,
  )
  const negativeTrace = traces.find(
    (trace) => trace.pcb_trace_id === pair.negative.pcb_trace_id,
  )
  expect(
    (positiveTrace?.trace_length ?? 0) - (negativeTrace?.trace_length ?? 0),
  ).toBeCloseTo(DETOUR_EXTRA_LENGTH, 5)

  for (const x of [-11, -3, 5]) {
    for (const segments of [pair.positive.segments, pair.negative.segments]) {
      const segment = segmentAtX({ segments, x })
      expect(segment.coupling).toBe("coupled")
      expect(segment.local_skew).toBe(0)
    }
  }

  const positiveOverLoop = segmentAtX({
    segments: pair.positive.segments,
    x: 7,
  })
  expect(positiveOverLoop.coupling).toBe("interpolated")
  expect(positiveOverLoop.local_skew).toBeGreaterThan(0)
  expect(positiveOverLoop.local_skew).toBeLessThan(DETOUR_EXTRA_LENGTH)

  const positiveAfter = segmentAtX({ segments: pair.positive.segments, x: 10 })
  const negativeAfter = segmentAtX({ segments: pair.negative.segments, x: 10 })
  expect(positiveAfter.coupling).toBe("coupled")
  expect(positiveAfter.local_skew).toBeCloseTo(DETOUR_EXTRA_LENGTH, 5)
  expect(negativeAfter.local_skew).toBeCloseTo(-DETOUR_EXTRA_LENGTH, 5)
  expect(pair.max_local_skew).toBeCloseTo(DETOUR_EXTRA_LENGTH, 5)

  await expect(localSkewSvg(circuitJson)).toMatchSvgSnapshot(import.meta.path)
})
