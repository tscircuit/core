import { expect, test } from "bun:test"
import { getStoredLocalSkew } from "tests/fixtures/local-skew/get-stored-local-skew"
import { localSkewSvg } from "tests/fixtures/local-skew/local-skew-svg"
import {
  type PairPathPoint,
  renderPairBoard,
} from "tests/fixtures/local-skew/pair-board"
import { segmentAtX } from "tests/fixtures/local-skew/segment-at-x"

/** Extra length of each 2 mm × 2.4 mm fan-in / fan-out diagonal on DN. */
const FAN_DIAGONAL_EXTRA = Math.hypot(2, 2.4) - 2

const NEGATIVE_FAN_PATH: PairPathPoint[] = [
  { x: 4, y: 0 },
  { x: 6, y: 2.4 },
  { x: 18, y: 2.4 },
  { x: 20, y: 0 },
]

test("a straight trace running into wider pads still couples at both pad fan-outs", async () => {
  // DP runs straight at y = 1.5 as one joined step while DN fans in from
  // y = -1.5 (3 mm pad pitch) to y = 0.9 (0.6 mm pair pitch) and back out.
  // Clipping the straddling DP step at the central run's ends lets both
  // 3 mm pad-pitch stretches couple, matching an invisible 0.2 µm kink.
  const straightJson = renderPairBoard({
    sourcePadHalfPitch: 1.5,
    loadPadHalfPitch: 1.5,
    pcbTraceGap: "0.45mm",
    positivePath: [],
    negativePath: NEGATIVE_FAN_PATH,
  })
  const kinkedJson = renderPairBoard({
    sourcePadHalfPitch: 1.5,
    loadPadHalfPitch: 1.5,
    pcbTraceGap: "0.45mm",
    positivePath: [
      { x: 4, y: 0 },
      { x: 5, y: 0.0002 },
      { x: 6, y: 0 },
      { x: 18, y: 0 },
      { x: 19, y: 0.0002 },
      { x: 20, y: 0 },
    ],
    negativePath: NEGATIVE_FAN_PATH,
  })

  const [straight] = getStoredLocalSkew(straightJson)
  const [kinked] = getStoredLocalSkew(kinkedJson)

  for (const pair of [straight, kinked]) {
    const startFanout = segmentAtX({ segments: pair.positive.segments, x: -10 })
    const middle = segmentAtX({ segments: pair.positive.segments, x: 0 })
    const endFanout = segmentAtX({ segments: pair.positive.segments, x: 10 })

    expect(startFanout.coupling).toBe("coupled")
    expect(startFanout.local_skew).toBe(0)
    expect(middle.coupling).toBe("coupled")
    expect(middle.local_skew).toBeCloseTo(-FAN_DIAGONAL_EXTRA, 5)
    expect(endFanout.coupling).toBe("coupled")
    expect(endFanout.local_skew).toBeCloseTo(-2 * FAN_DIAGONAL_EXTRA, 5)
    expect(pair.max_local_skew).toBeCloseTo(2 * FAN_DIAGONAL_EXTRA, 5)
  }

  expect(straight.max_local_skew).toBe(kinked.max_local_skew)

  await expect(localSkewSvg(straightJson)).toMatchSvgSnapshot(import.meta.path)
})
