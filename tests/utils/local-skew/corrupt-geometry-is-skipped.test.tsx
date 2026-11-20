import { expect, test } from "bun:test"
import type { PcbTrace } from "circuit-json"
import { computeLocalSkew } from "lib/utils/local-skew/compute-local-skew"
import { renderPairBoard } from "tests/fixtures/local-skew/pair-board"

test("a pair with non-finite or absurd coordinates is skipped instead of hanging", () => {
  for (const x of [Number.POSITIVE_INFINITY, Number.NaN, 1e18]) {
    const circuitJson = renderPairBoard({
      positivePath: [{ x: 6, y: 0 }],
      negativePath: [],
      pcbTraceGap: "0.45mm",
    })
    const positiveTrace = circuitJson.find(
      (element): element is PcbTrace => element.type === "pcb_trace",
    )
    const corner = positiveTrace?.route[1]
    if (corner?.route_type !== "wire") throw new Error("Expected a wire corner")
    corner.x = x

    expect(computeLocalSkew({ circuitJson })).toEqual({
      pairs: [],
      splitPairs: [],
      failedPairs: [],
    })
  }
})
