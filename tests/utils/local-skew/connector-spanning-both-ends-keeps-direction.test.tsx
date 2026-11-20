import { expect, test } from "bun:test"
import { localSkewSvg } from "tests/fixtures/local-skew/local-skew-svg"
import { getStoredLocalSkew } from "tests/fixtures/local-skew/get-stored-local-skew"
import { renderSpanningConnectorBoard } from "tests/fixtures/local-skew/spanning-connector-board"
import { segmentAtX } from "tests/fixtures/local-skew/segment-at-x"

test("a connector at the start of one trace and the end of the other doesn't flip the pair", async () => {
  const circuitJson = renderSpanningConnectorBoard()
  const [pair] = getStoredLocalSkew(circuitJson)

  for (const segments of [pair.positive.segments, pair.negative.segments]) {
    const middle = segmentAtX({ segments, x: 0 })
    expect(middle.coupling).toBe("coupled")
    expect(middle.local_skew).toBe(0)
  }
  expect(pair.max_local_skew).toBe(0)

  await expect(localSkewSvg(circuitJson)).toMatchSvgSnapshot(import.meta.path)
})
