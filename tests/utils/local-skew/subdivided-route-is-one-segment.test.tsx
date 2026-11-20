import { expect, test } from "bun:test"
import { localSkewSvg } from "tests/fixtures/local-skew/local-skew-svg"
import { getStoredLocalSkew } from "tests/fixtures/local-skew/get-stored-local-skew"
import {
  type PairPathPoint,
  renderPairBoard,
} from "tests/fixtures/local-skew/pair-board"

test("a straight route split into many points is measured as one segment", async () => {
  const everyMillimetre: PairPathPoint[] = []
  for (let x = 1; x < 24; x++) everyMillimetre.push({ x, y: 0 })

  const circuitJson = renderPairBoard({
    positivePath: everyMillimetre,
    negativePath: [],
    pcbTraceGap: "0.45mm",
  })
  const [pair] = getStoredLocalSkew(circuitJson)

  expect(pair.positive.segments).toHaveLength(1)
  expect(pair.positive.segments[0].local_skew).toBe(0)

  await expect(localSkewSvg(circuitJson)).toMatchSvgSnapshot(import.meta.path)
})
