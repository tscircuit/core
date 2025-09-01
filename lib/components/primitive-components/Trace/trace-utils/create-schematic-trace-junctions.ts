import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { SchematicTrace } from "circuit-json"
import { getOtherSchematicTraces } from "./get-other-schematic-traces"

const TOLERANCE = 0.001 // 1mm tolerance for floating-point comparisons

// Helper function to check if a point is within an edge's bounds
const isPointWithinEdge = (
  point: { x: number; y: number },
  edge: SchematicTrace["edges"][number],
): boolean => {
  const minX = Math.min(edge.from.x, edge.to.x)
  const maxX = Math.max(edge.from.x, edge.to.x)
  const minY = Math.min(edge.from.y, edge.to.y)
  const maxY = Math.max(edge.from.y, edge.to.y)

  return (
    point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY
  )
}

// Helper function to determine edge orientation
const getEdgeOrientation = (
  edge: SchematicTrace["edges"][number],
): "vertical" | "horizontal" | "diagonal" => {
  const isVertical = Math.abs(edge.from.x - edge.to.x) < TOLERANCE
  const isHorizontal = Math.abs(edge.from.y - edge.to.y) < TOLERANCE

  if (isVertical) return "vertical"
  if (isHorizontal) return "horizontal"
  return "diagonal"
}

const getIntersectionPoint = (
  edge1: SchematicTrace["edges"][number],
  edge2: SchematicTrace["edges"][number],
): { x: number; y: number } | null => {
  const orientation1 = getEdgeOrientation(edge1)
  const orientation2 = getEdgeOrientation(edge2)

  // Both edges are vertical or both horizontal - no intersection
  if (orientation1 === orientation2) {
    return null
  }

  // Handle vertical-horizontal intersections
  if (
    (orientation1 === "vertical" && orientation2 === "horizontal") ||
    (orientation1 === "horizontal" && orientation2 === "vertical")
  ) {
    const verticalEdge = orientation1 === "vertical" ? edge1 : edge2
    const horizontalEdge = orientation1 === "horizontal" ? edge1 : edge2

    const x = verticalEdge.from.x
    const y = horizontalEdge.from.y
    const intersection = { x, y }

    return isPointWithinEdge(intersection, edge1) &&
      isPointWithinEdge(intersection, edge2)
      ? intersection
      : null
  }

  // Handle vertical-diagonal intersections
  if (orientation1 === "vertical" || orientation2 === "vertical") {
    const verticalEdge = orientation1 === "vertical" ? edge1 : edge2
    const diagonalEdge = orientation1 === "vertical" ? edge2 : edge1

    const x = verticalEdge.from.x
    const m =
      (diagonalEdge.to.y - diagonalEdge.from.y) /
      (diagonalEdge.to.x - diagonalEdge.from.x)
    const b = diagonalEdge.from.y - m * diagonalEdge.from.x
    const y = m * x + b

    const intersection = { x, y }
    return isPointWithinEdge(intersection, edge1) &&
      isPointWithinEdge(intersection, edge2)
      ? intersection
      : null
  }

  // Handle diagonal-diagonal intersections
  const m1 = (edge1.to.y - edge1.from.y) / (edge1.to.x - edge1.from.x)
  const b1 = edge1.from.y - m1 * edge1.from.x

  const m2 = (edge2.to.y - edge2.from.y) / (edge2.to.x - edge2.from.x)
  const b2 = edge2.from.y - m2 * edge2.from.x

  // Parallel lines - no intersection
  if (Math.abs(m1 - m2) < TOLERANCE) {
    return null
  }

  const x = (b2 - b1) / (m1 - m2)
  const y = m1 * x + b1
  const intersection = { x, y }

  return isPointWithinEdge(intersection, edge1) &&
    isPointWithinEdge(intersection, edge2)
    ? intersection
    : null
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

  // Use a more efficient data structure for deduplication
  const junctions = new Map<string, { x: number; y: number }>()

  // Helper function to check if a point is close to an edge endpoint
  const isPointCloseToEndpoint = (
    point: { x: number; y: number },
    edge: SchematicTrace["edges"][number],
  ): boolean => {
    const distanceToFrom = Math.sqrt(
      Math.pow(point.x - edge.from.x, 2) + Math.pow(point.y - edge.from.y, 2),
    )
    const distanceToTo = Math.sqrt(
      Math.pow(point.x - edge.to.x, 2) + Math.pow(point.y - edge.to.y, 2),
    )
    return distanceToFrom < TOLERANCE || distanceToTo < TOLERANCE
  }

  for (const myEdge of myEdges) {
    for (const otherEdge of otherEdges) {
      const intersection = getIntersectionPoint(myEdge, otherEdge)
      if (intersection) {
        // Only create junctions for T-intersections where at least one edge
        // has an endpoint at the intersection point (not X-crossings)
        const isMyEdgeEndpoint = isPointCloseToEndpoint(intersection, myEdge)
        const isOtherEdgeEndpoint = isPointCloseToEndpoint(
          intersection,
          otherEdge,
        )

        if (isMyEdgeEndpoint || isOtherEdgeEndpoint) {
          // Use a more precise key format to avoid floating-point issues
          const key = `${intersection.x.toFixed(6)},${intersection.y.toFixed(6)}`
          if (!junctions.has(key)) {
            junctions.set(key, intersection)
          }
        }
      }
    }
  }

  return Array.from(junctions.values())
}
