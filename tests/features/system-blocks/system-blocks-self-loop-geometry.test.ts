import { expect, test } from "bun:test"
import { createSystemBlockSelfLoop } from "lib/utils/system-blocks/create-system-block-self-loop"

test("self-loops use a circular return while preserving attachments, bounds, and label clearance", () => {
  const block = { center: { x: 0, y: 0 }, width: 48, height: 24 }
  const route = [
    { x: 24, y: 6 },
    { x: 42, y: 12 },
    { x: 50, y: 6 },
    { x: 52, y: 0 },
    { x: 50, y: -6 },
    { x: 42, y: -12 },
    { x: 24, y: -6 },
  ]
  const original = structuredClone(route)
  // The label overlaps the controls' bounding box, but not the actual arc.
  const label = { minX: 37, maxX: 47, minY: -2, maxY: 2 }
  const loop = createSystemBlockSelfLoop(route, block, [label])!
  expect(loop).toHaveLength(5)
  expect(route).toEqual(original)
  expect(loop[0]).toEqual(route[0])
  expect(loop.at(-1)).toEqual(route.at(-1))
  expect(loop[1]).toEqual({ x: 46, y: 6 })
  expect(loop[3].x).toBe(46)
  expect(loop[3].y).toBe(-6)
  for (const index of [2, 3]) {
    const start = loop[index - 1]
    const end = loop[index]
    const [a, b] = end.cubic_bezier_control_points!
    for (let step = 0; step <= 100; step++) {
      const t = step / 100
      const s = 1 - t
      const x =
        s ** 3 * start.x +
        3 * s * s * t * a.x +
        3 * s * t * t * b.x +
        t ** 3 * end.x
      const y =
        s ** 3 * start.y +
        3 * s * s * t * a.y +
        3 * s * t * t * b.y +
        t ** 3 * end.y
      expect(Math.abs(Math.hypot(x - 46, y) - 6)).toBeLessThan(6 * 0.000273)
    }
  }
  for (const point of loop.flatMap((point) => [
    point,
    ...(point.cubic_bezier_control_points ?? []),
  ])) {
    expect(point.x).toBeGreaterThanOrEqual(24)
    expect(point.x).toBeLessThanOrEqual(52)
    expect(Math.abs(point.y)).toBeLessThanOrEqual(6)
  }
  for (const obstacle of [
    { minX: 43, maxX: 45, minY: 5, maxY: 7 }, // outgoing stem
    { minX: 51, maxX: 53, minY: -1, maxY: 1 }, // rounded end
    { minX: 43, maxX: 45, minY: -7, maxY: -5 }, // incoming stem
  ]) {
    expect(createSystemBlockSelfLoop(route, block, [obstacle])).toBeUndefined()
  }
  expect(
    createSystemBlockSelfLoop(
      [
        { x: 24, y: 6 },
        { x: 26, y: 0 },
        { x: 24, y: -6 },
      ],
      block,
      [],
    ),
  ).toBeUndefined()
})
