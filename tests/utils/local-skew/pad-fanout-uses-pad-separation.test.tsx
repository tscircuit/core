import { expect, test } from "bun:test"
import { getStoredLocalSkew } from "tests/fixtures/local-skew/get-stored-local-skew"
import { localSkewSvg } from "tests/fixtures/local-skew/local-skew-svg"
import { renderPairBoard } from "tests/fixtures/local-skew/pair-board"
import { segmentAtX } from "tests/fixtures/local-skew/segment-at-x"

/** Extra length added by each 0.9 mm square detour on the fan-in/fan-out. */
const FANOUT_DETOUR_EXTRA = 2 * 0.9

test("parallel stretches leaving wider source and load pads couple at each end's own pad separation", async () => {
  // Source pads are 3.0 mm apart (y = ±1.5), load pads 1.2 mm apart (y = ±0.6),
  // both wider than the 0.45 mm trace gap's 0.72 mm coupling limit. Using the
  // load separation at the source (1.2 * 1.2 = 1.44 < 3.0) would uncouple the
  // start fan-in; using the source separation at the load (3.0 * 1.2 = 3.6)
  // would wrongly couple DN's flat detour top at 2.1 mm separation (x = 8.75).
  const circuitJson = renderPairBoard({
    sourcePadHalfPitch: 1.5,
    loadPadHalfPitch: 0.6,
    positivePath: [
      { x: 3, y: 0 },
      { x: 3, y: 0.9 },
      { x: 3.5, y: 0.9 },
      { x: 3.5, y: 0 },
      { x: 4, y: 0 },
      { x: 6, y: -1.2 },
      { x: 18, y: -1.2 },
      { x: 20, y: -0.9 },
    ],
    negativePath: [
      { x: 4, y: 0 },
      { x: 6, y: 1.2 },
      { x: 18, y: 1.2 },
      { x: 20, y: 0.9 },
      { x: 20.5, y: 0.9 },
      { x: 20.5, y: 0 },
      { x: 21, y: 0 },
      { x: 21, y: 0.9 },
    ],
    pcbTraceGap: "0.45mm",
  })

  const [pair] = getStoredLocalSkew(circuitJson)

  const startFanout = segmentAtX({ segments: pair.positive.segments, x: -10.5 })
  const mainRun = segmentAtX({ segments: pair.positive.segments, x: 0 })
  const loadDetour = segmentAtX({ segments: pair.positive.segments, x: 8.75 })
  const endFanout = segmentAtX({ segments: pair.positive.segments, x: 10.5 })

  expect(startFanout.local_skew).toBe(0)
  expect(mainRun.local_skew).toBeCloseTo(FANOUT_DETOUR_EXTRA, 5)
  // Uncoupled, DN's detour ramps in instead of being measured right away.
  expect(loadDetour.local_skew).toBeGreaterThan(0)
  expect(loadDetour.local_skew).toBeLessThan(FANOUT_DETOUR_EXTRA)
  expect(endFanout.local_skew).toBe(0)
  expect(pair.max_local_skew).toBeCloseTo(FANOUT_DETOUR_EXTRA, 5)

  await expect(localSkewSvg(circuitJson)).toMatchSvgSnapshot(import.meta.path)
})
