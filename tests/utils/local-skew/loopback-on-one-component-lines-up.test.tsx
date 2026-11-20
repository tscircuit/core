import { expect, test } from "bun:test"
import { localSkewSvg } from "tests/fixtures/local-skew/local-skew-svg"
import { getStoredLocalSkew } from "tests/fixtures/local-skew/get-stored-local-skew"
import { renderLoopbackBoard } from "tests/fixtures/local-skew/loopback-board"
import { segmentAtX } from "tests/fixtures/local-skew/segment-at-x"

test("a loopback with all pads on one part lines the traces up by their ends", async () => {
  const circuitJson = renderLoopbackBoard()
  const [pair] = getStoredLocalSkew(circuitJson)

  const middle = segmentAtX({ segments: pair.positive.segments, x: 0 })
  expect(middle.local_skew).toBe(0)
  expect(pair.max_local_skew).toBe(0)

  await expect(localSkewSvg(circuitJson)).toMatchSvgSnapshot(import.meta.path)
})
