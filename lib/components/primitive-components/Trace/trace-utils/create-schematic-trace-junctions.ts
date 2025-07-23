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
  const TOLERANCE = 0.001 // 1mm tolerance for floating-point comparisons

  const isVertical1 = Math.abs(edge1.from.x - edge1.to.x) < TOLERANCE
  const isVertical2 = Math.abs(edge2.from.x - edge2.to.x) < TOLERANCE
  const isHorizontal1 = Math.abs(edge1.from.y - edge1.to.y) < TOLERANCE
  const isHorizontal2 = Math.abs(edge2.from.y - edge2.to.y) < TOLERANCE

  // Both edges are vertical - no intersection
  if (isVertical1 && isVertical2) {
    return null
  }

  // Both edges are horizontal - no intersection
  if (isHorizontal1 && isHorizontal2) {
    return null
  }

  // Edge1 is vertical, Edge2 is horizontal
  if (isVertical1 && isHorizontal2) {
    const x = edge1.from.x
    const y = edge2.from.y

    // Check if the intersection point is within both edges
    if (
      x >= Math.min(edge2.from.x, edge2.to.x) &&
      x <= Math.max(edge2.from.x, edge2.to.x) &&
      y >= Math.min(edge1.from.y, edge1.to.y) &&
      y <= Math.max(edge1.from.y, edge1.to.y)
    ) {
      return { x, y }
    }
    return null
  }

  // Edge1 is horizontal, Edge2 is vertical
  if (isHorizontal1 && isVertical2) {
    const x = edge2.from.x
    const y = edge1.from.y

    // Check if the intersection point is within both edges
    if (
      x >= Math.min(edge1.from.x, edge1.to.x) &&
      x <= Math.max(edge1.from.x, edge1.to.x) &&
      y >= Math.min(edge2.from.y, edge2.to.y) &&
      y <= Math.max(edge2.from.y, edge2.to.y)
    ) {
      return { x, y }
    }
    return null
  }

  // Edge1 is vertical, Edge2 is diagonal
  if (isVertical1) {
    const x = edge1.from.x
    const m2 = (edge2.to.y - edge2.from.y) / (edge2.to.x - edge2.from.x)
    const b2 = edge2.from.y - m2 * edge2.from.x
    const y = m2 * x + b2

    if (
      x >= Math.min(edge2.from.x, edge2.to.x) &&
      x <= Math.max(edge2.from.x, edge2.to.x) &&
      y >= Math.min(edge2.from.y, edge2.to.y) &&
      y <= Math.max(edge2.from.y, edge2.to.y) &&
      y >= Math.min(edge1.from.y, edge1.to.y) &&
      y <= Math.max(edge1.from.y, edge1.to.y)
    ) {
      return { x, y }
    }

    return null
  }

  // Edge2 is vertical, Edge1 is diagonal
  if (isVertical2) {
    const x = edge2.from.x
    const m1 = (edge1.to.y - edge1.from.y) / (edge1.to.x - edge1.from.x)
    const b1 = edge1.from.y - m1 * edge1.from.x
    const y = m1 * x + b1

    if (
      x >= Math.min(edge1.from.x, edge1.to.x) &&
      x <= Math.max(edge1.from.x, edge1.to.x) &&
      y >= Math.min(edge1.from.y, edge1.to.y) &&
      y <= Math.max(edge1.from.y, edge1.to.y) &&
      y >= Math.min(edge2.from.y, edge2.to.y) &&
      y <= Math.max(edge2.from.y, edge2.to.y)
    ) {
      return { x, y }
    }
    return null
  }

  // Both edges are diagonal
  const m1 = (edge1.to.y - edge1.from.y) / (edge1.to.x - edge1.from.x)
  const b1 = edge1.from.y - m1 * edge1.from.x

  const m2 = (edge2.to.y - edge2.from.y) / (edge2.to.x - edge2.from.x)
  const b2 = edge2.from.y - m2 * edge2.from.x

  if (Math.abs(m1 - m2) < TOLERANCE) {
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
  const junctionPoints: Array<{ x: number; y: number }> = []

  for (const myEdge of myEdges) {
    for (const otherEdge of otherEdges) {
      const intersection = getIntersectionPoint(myEdge, otherEdge)
      if (intersection) {
        const pointKey = `${intersection.x},${intersection.y}`
        if (!junctions.has(pointKey)) {
          junctions.add(pointKey)
          junctionPoints.push({ x: intersection.x, y: intersection.y })
        }
      }
    }
  }

  return junctionPoints
}
