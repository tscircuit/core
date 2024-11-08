import type { SoupUtilObjects } from "@tscircuit/soup-util"
import type { SchematicTrace } from "circuit-json"
import { getOtherSchematicTraces } from "./get-other-schematic-traces"

const isOrthogonal = (
  edge1: SchematicTrace["edges"][number],
  edge2: SchematicTrace["edges"][number],
): boolean => {
  const isVertical1 = edge1.from.x === edge1.to.x
  const isVertical2 = edge2.from.x === edge2.to.x
  return isVertical1 !== isVertical2
}

const getIntersectionPoint = (
  edge1: SchematicTrace["edges"][number],
  edge2: SchematicTrace["edges"][number],
): { x: number; y: number } | null => {
  // Skip if edges aren't orthogonal
  if (!isOrthogonal(edge1, edge2)) return null

  const isVertical1 = edge1.from.x === edge1.to.x
  const vertical = isVertical1 ? edge1 : edge2
  const horizontal = isVertical1 ? edge2 : edge1

  // Check if the vertical line's x is between horizontal line's x range
  const minX = Math.min(horizontal.from.x, horizontal.to.x)
  const maxX = Math.max(horizontal.from.x, horizontal.to.x)
  if (vertical.from.x < minX || vertical.from.x > maxX) return null

  // Check if the horizontal line's y is between vertical line's y range
  const minY = Math.min(vertical.from.y, vertical.to.y)
  const maxY = Math.max(vertical.from.y, vertical.to.y)
  if (horizontal.from.y < minY || horizontal.from.y > maxY) return null

  // Lines intersect, return intersection point
  return {
    x: vertical.from.x,
    y: horizontal.from.y,
  }
}

export const createSchematicTraceJunctions = ({
  edges: myEdges,
  db,
  source_trace_id,
}: {
  edges: SchematicTrace["edges"]
  db: SoupUtilObjects
  source_trace_id: string
}): Array<{ x: number; y: number }> => {
  const otherEdges: SchematicTrace["edges"] = getOtherSchematicTraces({
    db,
    source_trace_id,
    sameNetOnly: true,
  }).flatMap((t: SchematicTrace) => t.edges)

  const junctions = new Set<string>()

  // Check intersections between my edges and other edges
  for (const myEdge of myEdges) {
    for (const otherEdge of otherEdges) {
      const intersection = getIntersectionPoint(myEdge, otherEdge)
      if (intersection) {
        // Use string key to deduplicate points
        junctions.add(`${intersection.x},${intersection.y}`)
      }
    }
  }

  // Check intersections between my own edges
  for (let i = 0; i < myEdges.length; i++) {
    for (let j = i + 1; j < myEdges.length; j++) {
      const intersection = getIntersectionPoint(myEdges[i], myEdges[j])
      if (intersection) {
        junctions.add(`${intersection.x},${intersection.y}`)
      }
    }
  }

  // Convert back to point objects
  return Array.from(junctions).map((key) => {
    const [x, y] = key.split(",").map(Number)
    return { x, y }
  })
}
