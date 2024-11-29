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

const isBetween = (value: number, min: number, max: number): boolean => {
  return value > Math.min(min, max) && value < Math.max(min, max)
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

  // Only create junction if vertical line intersects middle of horizontal line
  if (!isBetween(vertical.from.x, horizontal.from.x, horizontal.to.x))
    return null

  // Only create junction if horizontal line intersects middle of vertical line
  if (!isBetween(horizontal.from.y, vertical.from.y, vertical.to.y)) return null

  // Ensure it's not an endpoint connection
  if (
    vertical.from.x === horizontal.from.x &&
    vertical.from.y === horizontal.from.y
  )
    return null
  if (
    vertical.from.x === horizontal.to.x &&
    vertical.from.y === horizontal.to.y
  )
    return null
  if (
    vertical.to.x === horizontal.from.x &&
    vertical.to.y === horizontal.from.y
  )
    return null
  if (vertical.to.x === horizontal.to.x && vertical.to.y === horizontal.to.y)
    return null

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
  const otherTraces = getOtherSchematicTraces({
    db,
    source_trace_id,
    sameNetOnly: true,
  })

  const junctions = new Set<string>()

  // Check for true T-intersections only
  for (const myEdge of myEdges) {
    for (const otherTrace of otherTraces) {
      for (const otherEdge of otherTrace.edges) {
        const intersection = getIntersectionPoint(myEdge, otherEdge)
        if (intersection) {
          // Use string key to deduplicate points
          junctions.add(`${intersection.x},${intersection.y}`)
        }
      }
    }
  }

  // Convert back to point objects
  return Array.from(junctions).map((key) => {
    const [x, y] = key.split(",").map(Number)
    return { x, y }
  })
}
