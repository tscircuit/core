import { expect, test } from "bun:test"
import { localSkewSvg } from "tests/fixtures/local-skew/local-skew-svg"
import { getStoredLocalSkew } from "tests/fixtures/local-skew/get-stored-local-skew"
import { renderPairBoard } from "tests/fixtures/local-skew/pair-board"

test("a pair that names the same trace on both sides is skipped", async () => {
  const circuitJson = renderPairBoard({
    positivePath: [],
    negativePath: [],
    positiveOnBothSides: true,
  })
  const pairs = getStoredLocalSkew(circuitJson)

  expect(pairs).toEqual([])

  await expect(localSkewSvg(circuitJson)).toMatchSvgSnapshot(import.meta.path)
})
