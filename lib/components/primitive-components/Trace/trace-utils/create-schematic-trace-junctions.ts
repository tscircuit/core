import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
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
  if (edge1.from.x === edge1.to.x && edge2.from.x === edge2.to.x) {
    return null
  }

  if (edge1.from.x === edge1.to.x) {
    const x = edge1.from.x
    const m2 = (edge2.to.y - edge2.from.y) / (edge2.to.x - edge2.from.x)
    const b2 = edge2.from.y - m2 * edge2.from.x
    const y = m2 * x + b2

    if (
      x >= Math.min(edge2.from.x, edge2.to.x) &&
      x <= Math.max(edge2.from.x, edge2.to.x) &&
      y >= Math.min(edge2.from.y, edge2.to.y) &&
      y <= Math.max(edge2.from.y, edge2.to.y)
    ) {
      return { x, y }
    }

    return null
  }

  if (edge2.from.x === edge2.to.x) {
    const x = edge2.from.x
    const m1 = (edge1.to.y - edge1.from.y) / (edge1.to.x - edge1.from.x)
    const b1 = edge1.from.y - m1 * edge1.from.x
    const y = m1 * x + b1

    if (
      x >= Math.min(edge1.from.x, edge1.to.x) &&
      x <= Math.max(edge1.from.x, edge1.to.x) &&
      y >= Math.min(edge1.from.y, edge1.to.y) &&
      y <= Math.max(edge1.from.y, edge1.to.y)
    ) {
      return { x, y }
    }
    return null
  }

  const m1 = (edge1.to.y - edge1.from.y) / (edge1.to.x - edge1.from.x)
  const b1 = edge1.from.y - m1 * edge1.from.x

  const m2 = (edge2.to.y - edge2.from.y) / (edge2.to.x - edge2.from.x)
  const b2 = edge2.from.y - m2 * edge2.from.x

  if (m1 === m2) {
    return null
  }

  const x = (b2 - b1) / (m1 - m2)
  const y = m1 * x + b1

  const isWithinEdge1 =
    x >= Math.min(edge1.from.x, edge1.to.x) &&
    x <= Math.max(edge1.from.x, edge1.to.x) &&
    y >= Math.min(edge1.from.y, edge1.to.y) &&
    y <= Math.max(edge1.from.y, edge1.to.y)

  const isWithinEdge2 =
    x >= Math.min(edge2.from.x, edge2.to.x) &&
    x <= Math.max(edge2.from.x, edge2.to.x) &&
    y >= Math.min(edge2.from.y, edge2.to.y) &&
    y <= Math.max(edge2.from.y, edge2.to.y)

  if (isWithinEdge1 && isWithinEdge2) {
    return { x, y }
  }

  return null
}

const areColinearAndOverlapping = (
  edge1: SchematicTrace["edges"][number],
  edge2: SchematicTrace["edges"][number],
): boolean => {
  // Check if both edges are vertical
  if (edge1.from.x === edge1.to.x && edge2.from.x === edge2.to.x && edge1.from.x === edge2.from.x) {
    // Check for y overlap
    const y1 = [edge1.from.y, edge1.to.y].sort((a, b) => a - b)
    const y2 = [edge2.from.y, edge2.to.y].sort((a, b) => a - b)
    return y1[1] >= y2[0] && y2[1] >= y1[0]
  }
  // Check if both edges are horizontal
  if (edge1.from.y === edge1.to.y && edge2.from.y === edge2.to.y && edge1.from.y === edge2.from.y) {
    // Check for x overlap
    const x1 = [edge1.from.x, edge1.to.x].sort((a, b) => a - b)
    const x2 = [edge2.from.x, edge2.to.x].sort((a, b) => a - b)
    return x1[1] >= x2[0] && x2[1] >= x1[0]
  }
  return false
}

export const createSchematicTraceJunctions = ({
  edges: myEdges,
  db,
  source_trace_id,
}: {
  edges: SchematicTrace["edges"]
  db: CircuitJsonUtilObjects
  source_trace_id: string
}): Array<{ x: number; y: number }> => {
  const otherEdges: SchematicTrace["edges"] = getOtherSchematicTraces({
    db,
    source_trace_id,
    sameNetOnly: true,
  }).flatMap((t: SchematicTrace) => t.edges)

  const junctions = new Set<string>()

  for (const myEdge of myEdges) {
    for (const otherEdge of otherEdges) {
      // Skip if colinear and overlapping (not a true intersection)
      if (areColinearAndOverlapping(myEdge, otherEdge)) continue
      const intersection = getIntersectionPoint(myEdge, otherEdge)
      if (intersection) {
        // Only add if intersection is strictly inside both edges (not at endpoints)
        const isStrictlyInside =
          intersection.x > Math.min(myEdge.from.x, myEdge.to.x) &&
          intersection.x < Math.max(myEdge.from.x, myEdge.to.x) &&
          intersection.y > Math.min(myEdge.from.y, myEdge.to.y) &&
          intersection.y < Math.max(myEdge.from.y, myEdge.to.y) &&
          intersection.x > Math.min(otherEdge.from.x, otherEdge.to.x) &&
          intersection.x < Math.max(otherEdge.from.x, otherEdge.to.x) &&
          intersection.y > Math.min(otherEdge.from.y, otherEdge.to.y) &&
          intersection.y < Math.max(otherEdge.from.y, otherEdge.to.y)
        if (isStrictlyInside) {
          const pointKey = `${intersection.x},${intersection.y}`
          junctions.add(pointKey)
        }
      }
    }
  }

  return Array.from(junctions).map((j) => {
    const [x, y] = j.split(",").map(Number)
    return { x, y }
  })
}
