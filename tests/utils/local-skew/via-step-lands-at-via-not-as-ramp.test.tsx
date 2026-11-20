import { expect, test } from "bun:test"
import { getStoredLocalSkew } from "tests/fixtures/local-skew/get-stored-local-skew"
import { localSkewSvg } from "tests/fixtures/local-skew/local-skew-svg"
import { renderPairBoard } from "tests/fixtures/local-skew/pair-board"
import { segmentAtX } from "tests/fixtures/local-skew/segment-at-x"

test("an asymmetric via lands as a step at the via instead of smearing across the uncoupled stretch", async () => {
  // DP drops to the bottom layer at x = -6 while DN stays on top until its own
  // via at x = 0; both return to top together at x = 6. Between x = -6 and
  // x = 0, DP has already paid the 1.6 mm via length and DN has not yet.
  const circuitJson = renderPairBoard({
    positivePath: [
      { x: 6, y: 0, via: true, fromLayer: "top", toLayer: "bottom" },
      { x: 18, y: 0, via: true, fromLayer: "bottom", toLayer: "top" },
    ],
    negativePath: [
      { x: 12, y: 0, via: true, fromLayer: "top", toLayer: "bottom" },
      { x: 18, y: 0, via: true, fromLayer: "bottom", toLayer: "top" },
    ],
    pcbTraceGap: "0.45mm",
  })

  const [pair] = getStoredLocalSkew(circuitJson)

  // Coupled before x = -6 and after x = 0 with zero skew.
  expect(
    segmentAtX({ segments: pair.positive.segments, x: -9 }).local_skew,
  ).toBe(0)
  expect(
    segmentAtX({ segments: pair.positive.segments, x: 3 }).local_skew,
  ).toBe(0)

  // Between the staggered vias, the via length has stepped in immediately at
  // x = -6 and stays flat across the uncoupled stretch until DN's via at x = 0.
  const positiveInterpolated = pair.positive.segments.filter(
    (segment) => segment.coupling === "interpolated",
  )
  const negativeInterpolated = pair.negative.segments.filter(
    (segment) => segment.coupling === "interpolated",
  )
  expect(positiveInterpolated).toHaveLength(1)
  expect(negativeInterpolated).toHaveLength(1)
  expect(positiveInterpolated[0].local_skew).toBeCloseTo(1.6, 5)
  expect(negativeInterpolated[0].local_skew).toBeCloseTo(-1.6, 5)
  expect(pair.positive).toMatchObject({
    positive_skew_scale: 1.6,
    negative_skew_scale: 0,
  })
  expect(pair.negative).toMatchObject({
    positive_skew_scale: 0,
    negative_skew_scale: 1.6,
  })
  expect(pair.max_local_skew).toBeCloseTo(1.6, 5)

  // Routing DN from its load pad must reverse start/end via lengths identically.
  const [reversed] = getStoredLocalSkew(
    renderPairBoard({
      positivePath: [
        { x: 6, y: 0, via: true, fromLayer: "top", toLayer: "bottom" },
        { x: 18, y: 0, via: true, fromLayer: "bottom", toLayer: "top" },
      ],
      negativePath: [
        { x: -6, y: 0, via: true, fromLayer: "top", toLayer: "bottom" },
        { x: -12, y: 0, via: true, fromLayer: "bottom", toLayer: "top" },
      ],
      pcbTraceGap: "0.45mm",
      negativeFromLoad: true,
    }),
  )
  const reversedPositiveInterpolated = reversed.positive.segments.filter(
    (segment) => segment.coupling === "interpolated",
  )
  const reversedNegativeInterpolated = reversed.negative.segments.filter(
    (segment) => segment.coupling === "interpolated",
  )
  expect(reversedPositiveInterpolated).toHaveLength(1)
  expect(reversedNegativeInterpolated).toHaveLength(1)
  expect(reversedPositiveInterpolated[0].local_skew).toBeCloseTo(1.6, 5)
  expect(reversedNegativeInterpolated[0].local_skew).toBeCloseTo(-1.6, 5)
  expect(reversed.positive).toMatchObject({
    positive_skew_scale: 1.6,
    negative_skew_scale: 0,
  })
  expect(reversed.negative).toMatchObject({
    positive_skew_scale: 0,
    negative_skew_scale: 1.6,
  })

  // Mirror: DN drops first at x = -6 while routed from load, so DN's endViaLength
  // on the reversed first step is what creates the flat step instead of a ramp.
  const [reversedNegativeFirst] = getStoredLocalSkew(
    renderPairBoard({
      positivePath: [
        { x: 12, y: 0, via: true, fromLayer: "top", toLayer: "bottom" },
        { x: 18, y: 0, via: true, fromLayer: "bottom", toLayer: "top" },
      ],
      negativePath: [
        { x: -6, y: 0, via: true, fromLayer: "top", toLayer: "bottom" },
        { x: -18, y: 0, via: true, fromLayer: "bottom", toLayer: "top" },
      ],
      pcbTraceGap: "0.45mm",
      negativeFromLoad: true,
    }),
  )
  const negFirstInterpolated = reversedNegativeFirst.negative.segments.filter(
    (segment) => segment.coupling === "interpolated",
  )
  expect(negFirstInterpolated).toHaveLength(1)
  expect(negFirstInterpolated[0].local_skew).toBeCloseTo(1.6, 5)
  expect(reversedNegativeFirst.negative).toMatchObject({
    positive_skew_scale: 1.6,
    negative_skew_scale: 0,
  })

  await expect(localSkewSvg(circuitJson)).toMatchSvgSnapshot(import.meta.path)
})
