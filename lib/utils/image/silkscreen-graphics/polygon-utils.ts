import type { BRepShape } from "circuit-json"
import type { Point, Polygon, PolygonNode } from "./types"

export const pointKey = ({ x, y }: Point) => `${x},${y}`

export const samePoint = (a: Point, b: Point) => a.x === b.x && a.y === b.y

export const closePolygon = (points: Polygon): Polygon => {
  if (points.length < 2) return points
  const first = points[0]!
  const last = points[points.length - 1]!
  return samePoint(first, last) ? [...points] : [...points, first]
}

export const polygonArea = (points: Polygon): number => {
  if (points.length < 3) return 0

  let area = 0
  for (let i = 0; i < points.length; i++) {
    const current = points[i]!
    const next = points[(i + 1) % points.length]!
    area += current.x * next.y - next.x * current.y
  }
  return area / 2
}

export const orientPolygon = ({
  points,
  clockwise,
}: {
  points: Polygon
  clockwise: boolean
}): Polygon => {
  const area = polygonArea(points)
  if (area === 0) return points
  const isClockwise = area < 0
  return isClockwise === clockwise ? points : [...points].reverse()
}

const pointInPolygon = (point: Point, polygon: Polygon): boolean => {
  let inside = false

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]!
    const b = polygon[j]!

    const intersects =
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x

    if (intersects) inside = !inside
  }

  return inside
}

const buildPolygonTree = (polygons: Polygon[]): PolygonNode[] => {
  const sortedPolygons = [...polygons].sort(
    (a, b) => Math.abs(polygonArea(b)) - Math.abs(polygonArea(a)),
  )
  const roots: PolygonNode[] = []

  const insertNode = (node: PolygonNode, candidates: PolygonNode[]) => {
    for (const candidate of candidates) {
      if (pointInPolygon(node.polygon[0]!, candidate.polygon)) {
        insertNode(node, candidate.children)
        return
      }
    }
    candidates.push(node)
  }

  for (const polygon of sortedPolygons) {
    insertNode({ polygon, children: [] }, roots)
  }

  return roots
}

export const polygonsToBrepShapes = (polygons: Polygon[]): BRepShape[] => {
  const shapes: BRepShape[] = []

  const visitNode = (node: PolygonNode, depth: number) => {
    if (depth % 2 === 0) {
      shapes.push({
        outer_ring: {
          vertices: orientPolygon({ points: node.polygon, clockwise: false }),
        },
        inner_rings: node.children.map((child) => ({
          vertices: orientPolygon({ points: child.polygon, clockwise: true }),
        })),
      })
    }

    for (const child of node.children) {
      for (const grandchild of child.children) {
        visitNode(grandchild, depth + 2)
      }
    }
  }

  for (const node of buildPolygonTree(polygons)) {
    visitNode(node, 0)
  }

  return shapes
}

const areCollinear = (a: Point, b: Point, c: Point) =>
  Math.abs((b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x)) < 1e-9

export const simplifyPolygon = (polygon: Polygon): Polygon => {
  if (polygon.length <= 4) return polygon

  const closedPolygon = closePolygon(polygon)
  const openPolygon = closedPolygon.slice(0, -1)
  const simplified: Polygon = []

  for (let index = 0; index < openPolygon.length; index++) {
    const previous =
      openPolygon[(index - 1 + openPolygon.length) % openPolygon.length]!
    const current = openPolygon[index]!
    const next = openPolygon[(index + 1) % openPolygon.length]!

    if (!areCollinear(previous, current, next)) {
      simplified.push(current)
    }
  }

  return closePolygon(simplified)
}

export const scalePolygonToTargetSize = ({
  polygon,
  bitmapWidth,
  bitmapHeight,
  targetSize,
}: {
  polygon: Polygon
  bitmapWidth: number
  bitmapHeight: number
  targetSize: { width: number; height: number }
}): Polygon => {
  const pixelWidth = targetSize.width / bitmapWidth
  const pixelHeight = targetSize.height / bitmapHeight

  return polygon.map((point) => ({
    x: (point.x - bitmapWidth / 2) * pixelWidth,
    y: (bitmapHeight / 2 - point.y) * pixelHeight,
  }))
}
