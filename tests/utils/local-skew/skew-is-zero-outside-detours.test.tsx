import { expect, test } from "bun:test"
import { localSkewSvg } from "tests/fixtures/local-skew/local-skew-svg"
import { getStoredLocalSkew } from "tests/fixtures/local-skew/get-stored-local-skew"
import { renderDifferentialPairBoard } from "tests/fixtures/local-skew/differential-pair-board"
import { segmentAtX } from "tests/fixtures/local-skew/segment-at-x"

test("skew is zero before the first detour and after the second", async () => {
  const circuitJson = renderDifferentialPairBoard({ compensated: true })
  const [pair] = getStoredLocalSkew(circuitJson)

  for (const segments of [pair.positive.segments, pair.negative.segments]) {
    expect(segmentAtX({ segments, x: -11 }).local_skew).toBe(0)
    expect(segmentAtX({ segments, x: 11 }).local_skew).toBe(0)
  }

  await expect(localSkewSvg(circuitJson)).toMatchSvgSnapshot(import.meta.path)
})
