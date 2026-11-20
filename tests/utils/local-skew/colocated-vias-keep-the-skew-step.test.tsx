import { expect, test } from "bun:test"
import { getStoredLocalSkew } from "tests/fixtures/local-skew/get-stored-local-skew"
import { walkTrace } from "lib/utils/local-skew/walk-trace"
import { localSkewSvg } from "tests/fixtures/local-skew/local-skew-svg"
import { renderPairBoard } from "tests/fixtures/local-skew/pair-board"
import { segmentAtX } from "tests/fixtures/local-skew/segment-at-x"

test("colocated vias keep their full skew step between straight runs", async () => {
  const circuitJson = renderPairBoard({
    positivePath: [],
    negativePath: [
      { x: 10, y: 0, via: true, fromLayer: "top", toLayer: "bottom" },
      { x: 10, y: 0, via: true, fromLayer: "bottom", toLayer: "top" },
    ],
    pcbTraceGap: "0.45mm",
    thickness: "0.8mm",
  })
  const [pair] = getStoredLocalSkew(circuitJson)

  const before = segmentAtX({ segments: pair.positive.segments, x: -4 })
  const after = segmentAtX({ segments: pair.positive.segments, x: 0 })
  expect(before.coupling).toBe("coupled")
  expect(before.local_skew).toBe(0)
  expect(after.coupling).toBe("coupled")
  expect(after.local_skew).toBeCloseTo(-1.6, 5)
  expect(pair.max_local_skew).toBeCloseTo(1.6, 5)

  const trace = circuitJson.find(
    (element) =>
      element.type === "pcb_trace" &&
      element.pcb_trace_id === pair.negative.pcb_trace_id,
  )
  if (trace?.type !== "pcb_trace") throw new Error("Missing negative trace")
  const { steps } = walkTrace({ trace, boardThickness: 0.8 })
  expect(steps).toHaveLength(2)
  expect(steps[0].endViaLength).toBeCloseTo(1.6, 5)
  expect(steps[1].startViaLength).toBeCloseTo(1.6, 5)

  await expect(localSkewSvg(circuitJson)).toMatchSvgSnapshot(import.meta.path)
})
