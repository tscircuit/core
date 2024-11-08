import { doesLineIntersectLine } from "@tscircuit/math-utils"
import type { SoupUtilObjects } from "@tscircuit/soup-util"
import type { SchematicTrace } from "circuit-json"
import { getOtherSchematicTraces } from "./get-other-schematic-traces"

/**
 *  Find all intersections between myEdges and all otherEdges and create a
 *  segment representing the crossing. Wherever there's a crossing, we create
 *  3 new edges. The middle edge has `is_crossing: true` and is 0.01mm wide
 */
export const createSchematicTraceCrossingSegments = ({
  edges,
  db,
  source_trace_id,
}: {
  edges: SchematicTrace["edges"]
  db: SoupUtilObjects
  source_trace_id: string
}) => {
  const otherEdges: SchematicTrace["edges"] = getOtherSchematicTraces({
    db,
    source_trace_id,
    differentNetOnly: true,
  }).flatMap((t: SchematicTrace) => t.edges)

  // For each edge in our trace
  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i]
    const edgeOrientation =
      edge.from.x === edge.to.x ? "vertical" : "horizontal"

    // Check against all other trace edges for intersections
    for (const otherEdge of otherEdges) {
      const otherOrientation =
        otherEdge.from.x === otherEdge.to.x ? "vertical" : "horizontal"

      // Only check perpendicular edges
      if (edgeOrientation === otherOrientation) continue

      // Check if the edges intersect
      const intersection = doesLineIntersectLine(
        [edge.from, edge.to],
        [otherEdge.from, otherEdge.to],
        { lineThickness: 0.01 },
      )

      if (intersection) {
        // Calculate intersection point
        const intersectX =
          edgeOrientation === "vertical" ? edge.from.x : otherEdge.from.x
        const intersectY =
          edgeOrientation === "vertical" ? otherEdge.from.y : edge.from.y

        // Create 3 new edges: before crossing, crossing segment, after crossing
        const crossingSegmentLength = 0.1 // mm
        const crossingPoint = { x: intersectX, y: intersectY }

        // Calculate points slightly before and after crossing
        const beforeCrossing = {
          x:
            edgeOrientation === "vertical"
              ? crossingPoint.x
              : crossingPoint.x - crossingSegmentLength / 2,
          y:
            edgeOrientation === "vertical"
              ? crossingPoint.y - crossingSegmentLength / 2
              : crossingPoint.y,
        }

        const afterCrossing = {
          x:
            edgeOrientation === "vertical"
              ? crossingPoint.x
              : crossingPoint.x + crossingSegmentLength / 2,
          y:
            edgeOrientation === "vertical"
              ? crossingPoint.y + crossingSegmentLength / 2
              : crossingPoint.y,
        }

        // Replace the original edge with 3 new edges
        const newEdges = [
          { from: edge.from, to: beforeCrossing },
          { from: beforeCrossing, to: afterCrossing, is_crossing: true },
          { from: afterCrossing, to: edge.to },
        ]

        // Replace the original edge with our new edges
        edges.splice(i, 1, ...newEdges)
        i += 2 // Skip the newly inserted edges
      }
    }
  }
}
