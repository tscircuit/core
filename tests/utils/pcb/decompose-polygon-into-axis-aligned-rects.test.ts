import { test, expect } from "bun:test"
import { decomposePolygonIntoAxisAlignedRects } from "lib/utils/pcb/decompose-polygon-into-axis-aligned-rects"

const pointInPolygon = (
  point: { x: number; y: number },
  polygon: Array<{ x: number; y: number }>,
) => {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const pi = polygon[i]!
    const pj = polygon[j]!
    if (
      pi.y > point.y !== pj.y > point.y &&
      point.x < ((pj.x - pi.x) * (point.y - pi.y)) / (pj.y - pi.y) + pi.x
    ) {
      inside = !inside
    }
  }
  return inside
}

test("rectangle decomposes into itself", () => {
  const rects = decomposePolygonIntoAxisAlignedRects([
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: 2, y: 1 },
    { x: 0, y: 1 },
  ])
  expect(rects.length).toBe(1)
  expect(rects[0]).toEqual({ x: 1, y: 0.5, width: 2, height: 1 })
})

test("same-span slabs merge vertically", () => {
  // plus sign: 3 slabs, the middle one wider — outer slabs must not merge
  // across it, but the two stem halves above and below stay separate rects
  const rects = decomposePolygonIntoAxisAlignedRects([
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 2, y: 1 },
    { x: 3, y: 1 },
    { x: 3, y: 2 },
    { x: 2, y: 2 },
    { x: 2, y: 3 },
    { x: 1, y: 3 },
    { x: 1, y: 2 },
    { x: 0, y: 2 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
  ])
  expect(rects.length).toBe(3)
  const total = rects.reduce((sum, r) => sum + r.width * r.height, 0)
  expect(total).toBeCloseTo(5, 9)
})

test("L-shape tiles exactly with no overlap", () => {
  const rects = decomposePolygonIntoAxisAlignedRects([
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: 2, y: 1 },
    { x: 1, y: 1 },
    { x: 1, y: 2 },
    { x: 0, y: 2 },
  ])
  const total = rects.reduce((sum, r) => sum + r.width * r.height, 0)
  expect(total).toBeCloseTo(3, 9)
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i]!
      const b = rects[j]!
      const overlapX = Math.abs(a.x - b.x) < (a.width + b.width) / 2 - 1e-9
      const overlapY = Math.abs(a.y - b.y) < (a.height + b.height) / 2 - 1e-9
      expect(overlapX && overlapY).toBe(false)
    }
  }
})

test("sub-minimum slivers are dropped", () => {
  const rects = decomposePolygonIntoAxisAlignedRects(
    [
      { x: 0, y: 0 },
      { x: 0.03, y: 0 },
      { x: 0.03, y: 5 },
      { x: 0, y: 5 },
    ],
    { minRectDimension: 0.05 },
  )
  expect(rects.length).toBe(0)
})

test("triangle emits nothing rather than an escaping rect", () => {
  const rects = decomposePolygonIntoAxisAlignedRects([
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
  ])
  expect(rects.length).toBe(0)
})

test("random star polygons never produce an escaping rect", () => {
  // deterministic LCG so the fuzz is reproducible
  let seed = 12345
  const random = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed / 2147483648
  }

  for (let iteration = 0; iteration < 300; iteration++) {
    const vertexCount = 3 + Math.floor(random() * 9)
    const polygon: Array<{ x: number; y: number }> = []
    for (let v = 0; v < vertexCount; v++) {
      const angle = (2 * Math.PI * v) / vertexCount
      const radius = 0.2 + random() * 1.8
      polygon.push({
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
      })
    }

    const rects = decomposePolygonIntoAxisAlignedRects(polygon)
    for (const rect of rects) {
      expect(rect.width).toBeGreaterThan(0)
      expect(rect.height).toBeGreaterThan(0)
      for (const [sx, sy] of [
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ]) {
        const corner = {
          x: rect.x + sx! * (rect.width / 2) * (1 - 1e-9),
          y: rect.y + sy! * (rect.height / 2) * (1 - 1e-9),
        }
        expect(pointInPolygon(corner, polygon)).toBe(true)
      }
    }
  }
})
