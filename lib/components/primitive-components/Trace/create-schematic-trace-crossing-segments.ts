import { distance, doesLineIntersectLine } from "@tscircuit/math-utils"
import type { SoupUtilObjects } from "@tscircuit/soup-util"
import type { SchematicTrace } from "circuit-json"
import { getOtherSchematicTraces } from "./get-other-schematic-traces"
import { getUnitVectorFromPointAToB } from "@tscircuit/math-utils"

/**
 *  Find all intersections between myEdges and all otherEdges and create a
 *  segment representing the crossing. Wherever there's a crossing, we create
 *  3 new edges. The middle edge has `is_crossing: true` and is 0.01mm wide
 */
export const createSchematicTraceCrossingSegments = ({
  edges: inputEdges,
  otherEdges,
}: {
  edges: SchematicTrace["edges"]
  otherEdges: SchematicTrace["edges"]
}) => {
  const edges = [...inputEdges]
  // For each edge in our trace
  for (let i = 0; i < edges.length; i++) {
    if (i > 2000) {
      debugger
      throw new Error(
        "Over 2000 iterations spent inside createSchematicTraceCrossingSegments, you have triggered an infinite loop, please report this!",
      )
    }
    const edge = edges[i]
    const edgeOrientation =
      Math.abs(edge.from.x - edge.to.x) < 0.01 ? "vertical" : "horizontal"

    // Check against all other trace edges for intersections
    const otherEdgesIntersections: Array<{
      otherEdge: SchematicTrace["edges"][number]
      crossingPoint: { x: number; y: number }
      distanceFromEdgeFrom: number
    }> = []
    for (const otherEdge of otherEdges) {
      const otherOrientation =
        otherEdge.from.x === otherEdge.to.x ? "vertical" : "horizontal"

      // Only check perpendicular edges
      if (edgeOrientation === otherOrientation) continue

      // Check if the edges intersect
      const hasIntersection = doesLineIntersectLine(
        [edge.from, edge.to],
        [otherEdge.from, otherEdge.to],
        { lineThickness: 0.01 },
      )

      if (hasIntersection) {
        // Calculate intersection point
        const intersectX =
          edgeOrientation === "vertical" ? edge.from.x : otherEdge.from.x
        const intersectY =
          edgeOrientation === "vertical" ? otherEdge.from.y : edge.from.y

        const crossingPoint = { x: intersectX, y: intersectY }

        otherEdgesIntersections.push({
          otherEdge,
          crossingPoint: crossingPoint,
          distanceFromEdgeFrom: distance(edge.from, crossingPoint),
        })
      }
    }

    if (otherEdgesIntersections.length === 0) continue

    // Find the closest intersection
    let closestIntersection = otherEdgesIntersections[0]
    for (const intersection of otherEdgesIntersections) {
      if (
        intersection.distanceFromEdgeFrom <
        closestIntersection.distanceFromEdgeFrom
      ) {
        closestIntersection = intersection
      }
    }

    // Create 3 new edges: before crossing, crossing segment, after crossing
    const crossingPoint = closestIntersection.crossingPoint
    const crossingSegmentLength = 0.075 // mm

    if (crossingPoint.x === edge.from.x && crossingPoint.y === edge.from.y) {
      // On top of each other, the unit vector would be undefined, no crossing
      // necessary
      continue
    }
    const crossingUnitVec = getUnitVectorFromPointAToB(edge.from, crossingPoint)

    // Calculate points slightly before and after crossing
    const beforeCrossing = {
      x: crossingPoint.x - (crossingUnitVec.x * crossingSegmentLength) / 2,
      y: crossingPoint.y - (crossingUnitVec.y * crossingSegmentLength) / 2,
    }

    const afterCrossing = {
      x: crossingPoint.x + (crossingUnitVec.x * crossingSegmentLength) / 2,
      y: crossingPoint.y + (crossingUnitVec.y * crossingSegmentLength) / 2,
    }

    // The trace is overshooting if the distance between afterCrossing and edge.to is less than crossingSegmentLength
    const overshot = distance(afterCrossing, edge.to) < crossingSegmentLength

    // Replace the original edge with 3 new edges
    const newEdges = [
      { from: edge.from, to: beforeCrossing },
      { from: beforeCrossing, to: afterCrossing, is_crossing: true },
      { from: afterCrossing, to: edge.to },
    ]

    // Replace the original edge with our new edges
    edges.splice(i, 1, ...newEdges)
    i += newEdges.length - 2 // Skip the first segment and the crossing segment

    // if we overshot the end of the edge, skip to the next edge
    if (overshot) {
      i++
    }
  }

  return edges
}
