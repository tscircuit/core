import { fillPolygonWithRects } from "./fillPolygonWithRects"

interface Point {
  x: number
  y: number
}

export interface RotatedRect {
  center: Point
  width: number
  height: number
  rotation: number
}

interface Rect {
  center: Point
  width: number
  height: number
}

export function generateApproximatingRects(
  rotatedRect: RotatedRect,
  numRects: number = 4,
): Rect[] {
  const { center, width, height, rotation } = rotatedRect

  const w2 = width / 2
  const h2 = height / 2

  const angleRad = (rotation * Math.PI) / 180
  const cosAngle = Math.cos(angleRad)
  const sinAngle = Math.sin(angleRad)

  const corners = [
    { x: -w2, y: -h2 },
    { x: w2, y: -h2 },
    { x: w2, y: h2 },
    { x: -w2, y: h2 },
  ]

  const rotatedCorners = corners.map((p) => ({
    x: center.x + p.x * cosAngle - p.y * sinAngle,
    y: center.y + p.x * sinAngle + p.y * cosAngle,
  }))

  const result = fillPolygonWithRects(rotatedCorners, {
    rectHeight: Math.min(width, height) / 2,
  })
  return result
}
