import { test, expect } from "bun:test"

test("core utils - point-in-polygon boundary ray casting", () => {
  const polygon = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 }
  ]
  const insidePoint = { x: 5, y: 5 }
  const outsidePoint = { x: 15, y: 5 }

  const contains = (poly: any[], p: any) => {
    let inside = false
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].x, yi = poly[i].y
      const xj = poly[j].x, yj = poly[j].y
      const intersect = ((yi > p.y) !== (yj > p.y)) && (p.x < (xj - xi) * (p.y - yi) / (yj - yi) + xi)
      if (intersect) inside = !inside
    }
    return inside
  }

  expect(contains(polygon, insidePoint)).toBeTrue()
  expect(contains(polygon, outsidePoint)).toBeFalse()
})
