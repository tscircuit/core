import { expect, test } from "bun:test"
import { getStoredLocalSkew } from "tests/fixtures/local-skew/get-stored-local-skew"
import {
  DETOUR_EXTRA_LENGTH,
  renderDirectedPairBoard,
} from "tests/fixtures/local-skew/directed-pair-board"
import { localSkewSvg } from "tests/fixtures/local-skew/local-skew-svg"
import { segmentAtX } from "tests/fixtures/local-skew/segment-at-x"

test("when only one trace has an output port, that trace walks from its output and the partner aligns by end distance", async () => {
  // Both DP and DN are stored receiver (x = -12) -> driver (x = 12), with DP
  // detouring near the driver at x = 9..10. Even when only one trace carries
  // `is_output`, both traces must walk from U_TX (x = 12) toward U_RX (x = -12).
  const positiveOnlyJson = renderDirectedPairBoard({ outputSide: "positive" })
  const negativeOnlyJson = renderDirectedPairBoard({ outputSide: "negative" })

  for (const circuitJson of [
    positiveOnlyJson,
    negativeOnlyJson,
    renderDirectedPairBoard({
      outputSide: "positive",
      negativeFromOutput: true,
    }),
    renderDirectedPairBoard({
      outputSide: "negative",
      negativeFromOutput: true,
    }),
  ]) {
    const [pair] = getStoredLocalSkew(circuitJson)
    expect(
      segmentAtX({ segments: pair.positive.segments, x: 11 }).local_skew,
    ).toBe(0)
    expect(
      segmentAtX({ segments: pair.positive.segments, x: 0 }).local_skew,
    ).toBeCloseTo(DETOUR_EXTRA_LENGTH, 5)
    expect(
      segmentAtX({ segments: pair.negative.segments, x: 0 }).local_skew,
    ).toBeCloseTo(-DETOUR_EXTRA_LENGTH, 5)
    expect(
      segmentAtX({ segments: pair.positive.segments, x: -11 }).local_skew,
    ).toBeCloseTo(DETOUR_EXTRA_LENGTH, 5)
  }

  await expect(localSkewSvg(positiveOnlyJson)).toMatchSvgSnapshot(
    import.meta.path,
  )
})
