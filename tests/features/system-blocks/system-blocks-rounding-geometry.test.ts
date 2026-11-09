import { expect, test } from "bun:test"
import type { Point, SystemBlockRoutePoint } from "circuit-json"
import { roundSystemBlockRoute } from "lib/utils/system-blocks/round-system-block-route"

/** Evaluate stored page-local cubic geometry without reusing the fillet construction. */
function evaluate(start: Point, end: SystemBlockRoutePoint, t: number): Point {
  const [a, b] = end.cubic_bezier_control_points!
  const s = 1 - t
  return {
    x:
      s ** 3 * start.x +
      3 * s * s * t * a.x +
      3 * s * t * t * b.x +
      t ** 3 * end.x,
    y:
      s ** 3 * start.y +
      3 * s * s * t * a.y +
      3 * s * t * t * b.y +
      t ** 3 * end.y,
  }
}

test("circle-derived routes preserve tangency, clearance, endpoints, and tight-segment bounds", () => {
  const original = [
    { x: 0, y: 0 },
    { x: 12, y: 0 },
    { x: 24, y: 0 },
    { x: 24, y: 24 },
  ]
  const copy = structuredClone(original)
  const rounded = roundSystemBlockRoute(original, [])
  expect(original).toEqual(copy)
  expect(rounded[0]).toEqual(original[0])
  expect(rounded.at(-1)).toEqual(original.at(-1))
  expect(rounded).toHaveLength(4)
  // The redundant collinear waypoint must not limit this corner to radius 6.
  expect(rounded[1].x).toBeCloseTo(12, 10)
  expect(rounded[1].y).toBe(0)
  expect(rounded[2].x).toBe(24)
  expect(rounded[2].y).toBeCloseTo(12, 10)
  const [departure, arrival] = rounded[2].cubic_bezier_control_points!
  expect(departure.y).toBe(0)
  expect(arrival.x).toBe(24)
  for (let step = 0; step <= 100; step++) {
    const point = evaluate(rounded[1], rounded[2], step / 100)
    expect(Math.abs(Math.hypot(point.x - 12, point.y - 12) - 12)).toBeLessThan(
      12 * 0.000273,
    )
  }
  // Mirroring the supplied points must mirror the generated controls as well.
  const reflected = roundSystemBlockRoute(
    original.map((p) => ({ x: p.x, y: -p.y })),
    [],
  )
  for (const [index, point] of reflected.entries()) {
    expect(point.x).toBeCloseTo(rounded[index].x, 10)
    expect(point.y).toBeCloseTo(-rounded[index].y, 10)
    for (const [i, control] of (
      point.cubic_bezier_control_points ?? []
    ).entries()) {
      expect(control.x).toBeCloseTo(
        rounded[index].cubic_bezier_control_points![i].x,
        10,
      )
      expect(control.y).toBeCloseTo(
        -rounded[index].cubic_bezier_control_points![i].y,
        10,
      )
    }
  }
  // Large turns are split at <=90 degrees and join with aligned tangent vectors.
  const acute = roundSystemBlockRoute(
    [
      { x: -30, y: 0 },
      { x: 0, y: 0 },
      { x: -20, y: 20 },
    ],
    [],
  )
  const arcs = acute.filter((p) => p.cubic_bezier_control_points)
  expect(arcs).toHaveLength(2)
  const before = arcs[0].cubic_bezier_control_points![1]
  const after = arcs[1].cubic_bezier_control_points![0]
  const tangentIn = { x: arcs[0].x - before.x, y: arcs[0].y - before.y }
  const tangentOut = { x: after.x - arcs[0].x, y: after.y - arcs[0].y }
  expect(tangentIn.x * tangentOut.y - tangentIn.y * tangentOut.x).toBeCloseTo(
    0,
    10,
  )
  expect(
    tangentIn.x * tangentOut.x + tangentIn.y * tangentOut.y,
  ).toBeGreaterThan(0)

  const tight = roundSystemBlockRoute(
    [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 4 },
      { x: 8, y: 4 },
    ],
    [],
  )
  expect(tight.filter((p) => p.cubic_bezier_control_points)).toHaveLength(2)
  for (const point of tight.flatMap((p) => [
    p,
    ...(p.cubic_bezier_control_points ?? []),
  ])) {
    expect(point.x).toBeGreaterThanOrEqual(0)
    expect(point.x).toBeLessThanOrEqual(8)
    expect(point.y).toBeGreaterThanOrEqual(0)
    expect(point.y).toBeLessThanOrEqual(4)
  }
  const obstacle = { minX: 18, maxX: 21, minY: 3, maxY: 6 }
  const clear = roundSystemBlockRoute(original, [obstacle])
  expect(clear[1].x).toBeGreaterThan(rounded[1].x)
  for (let index = 1; index < clear.length; index++) {
    if (!clear[index].cubic_bezier_control_points) continue
    for (let step = 0; step <= 100; step++) {
      const p = evaluate(clear[index - 1], clear[index], step / 100)
      expect(
        p.x > obstacle.minX &&
          p.x < obstacle.maxX &&
          p.y > obstacle.minY &&
          p.y < obstacle.maxY,
      ).toBe(false)
    }
  }
  const reversal = [
    { x: 0, y: 0 },
    { x: 12, y: 0 },
    { x: 0, y: 0 },
  ]
  expect(roundSystemBlockRoute(reversal, [])).toEqual(reversal)
  // The neighboring wire is only 2 mm below the original corner. Rounding
  // upward preserves that clearance even though the preferred gap is 3 mm.
  const besideWire = roundSystemBlockRoute(
    [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 8 },
    ],
    [],
    [{ minX: -2, maxX: 6, minY: -2, maxY: -2 }],
  )
  expect(besideWire).toHaveLength(4)
  expect(besideWire[2].cubic_bezier_control_points).toBeDefined()
  for (let step = 0; step <= 100; step++) {
    const p = evaluate(besideWire[1], besideWire[2], step / 100)
    expect(p.y + 2).toBeGreaterThanOrEqual(2)
  }
  expect(
    roundSystemBlockRoute(original, [
      { minX: 23, maxX: 25, minY: -1, maxY: 1 },
    ]),
  ).toEqual([original[0], original[2], original[3]])
  expect(
    roundSystemBlockRoute([original[0], original[0], original[1]], []),
  ).toEqual([original[0], original[1]])
})
