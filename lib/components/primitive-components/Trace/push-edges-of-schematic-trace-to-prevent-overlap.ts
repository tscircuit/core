import type { SchematicTrace } from "circuit-json"
import type { SoupUtilObjects } from "@tscircuit/soup-util"
import { doesLineIntersectLine } from "@tscircuit/math-utils"

/**
 *  Check if these edges run along any other schematic traces, if they do
 *  push them out of the way
 */
export const pushEdgesOfSchematicTraceToPreventOverlap = ({
  edges,
  db,
}: {
  edges: SchematicTrace["edges"]
  db: SoupUtilObjects
}) => {
  const otherEdges: SchematicTrace["edges"] = []
  for (const otherSchematicTrace of db.schematic_trace.list()) {
    otherEdges.push(...otherSchematicTrace.edges)
  }

  const edgeOrientation = (edge: SchematicTrace["edges"][number]) => {
    const { from, to } = edge
    return from.x === to.x ? "vertical" : "horizontal"
  }

  for (const mySegment of edges) {
    const mySegmentOrientation = edgeOrientation(mySegment)
    const findOverlappingParallelSegment = () =>
      otherEdges.find(
        (otherEdge) =>
          edgeOrientation(otherEdge) === mySegmentOrientation &&
          doesLineIntersectLine(
            [mySegment.from, mySegment.to],
            [otherEdge.from, otherEdge.to],
            {
              lineThickness: 0.01,
            },
          ),
      )
    let overlappingParallelSegmentFromOtherTrace =
      findOverlappingParallelSegment()
    while (overlappingParallelSegmentFromOtherTrace) {
      // Move my segment out of the way
      if (mySegmentOrientation === "horizontal") {
        mySegment.from.y += 0.1
        mySegment.to.y += 0.1
      } else {
        mySegment.from.x += 0.1
        mySegment.to.x += 0.1
      }
      overlappingParallelSegmentFromOtherTrace =
        findOverlappingParallelSegment()
      // TODO eventually push in the direction that makes the most sense to
      // reduce the number of intersections
    }
  }
}
