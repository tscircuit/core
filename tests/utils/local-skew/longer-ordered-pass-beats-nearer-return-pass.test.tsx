import { expect, test } from "bun:test"
import { localSkewSvg } from "tests/fixtures/local-skew/local-skew-svg"
import { getStoredLocalSkew } from "tests/fixtures/local-skew/get-stored-local-skew"
import { renderPairBoard } from "tests/fixtures/local-skew/pair-board"
import { segmentAtX } from "tests/fixtures/local-skew/segment-at-x"

test("a long pass in route order wins over a shorter, nearer return pass", async () => {
  // DN runs 0.6 mm below DP from x = -12 to 10, loops around the load, and
  // comes back above DP, 0.5 mm away, from x = -6 to 6.
  const circuitJson = renderPairBoard({
    positivePath: [],
    negativePath: [
      { x: 22, y: 0 },
      { x: 22, y: -1.7 },
      { x: 26, y: -1.7 },
      { x: 26, y: 3.3 },
      { x: 6, y: 3.3 },
      { x: 6, y: 1.1 },
      { x: 18, y: 1.1 },
      { x: 18, y: 2.3 },
      { x: 25, y: 2.3 },
      { x: 25, y: 0 },
    ],
    pcbTraceGap: "1mm",
  })
  const [pair] = getStoredLocalSkew(circuitJson)

  for (const x of [-9, 0, 8]) {
    const segment = segmentAtX({ segments: pair.positive.segments, x })
    expect(segment.coupling).toBe("coupled")
    expect(segment.local_skew).toBe(0)
  }

  await expect(localSkewSvg(circuitJson)).toMatchSvgSnapshot(import.meta.path)
})
