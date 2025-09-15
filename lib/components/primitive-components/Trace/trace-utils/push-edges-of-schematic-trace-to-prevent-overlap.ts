import type { SchematicTrace } from "circuit-json";
import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util";
import { doesLineIntersectLine } from "@tscircuit/math-utils";
import { getOtherSchematicTraces } from "./get-other-schematic-traces";

/**
 *  Check if these edges run along any other schematic traces, if they do
 *  push them out of the way
 */
export const pushEdgesOfSchematicTraceToPreventOverlap = ({
  edges,
  db,
  source_trace_id,
}: {
  edges: SchematicTrace["edges"];
  db: CircuitJsonUtilObjects;
  source_trace_id: string;
}) => {
  const mySourceTrace = db.source_trace.get(source_trace_id)!;
  const otherEdges: SchematicTrace["edges"] = getOtherSchematicTraces({
    db,
    source_trace_id,
    differentNetOnly: true,
  }).flatMap((t) => t.edges);

  const edgeOrientation = (edge: SchematicTrace["edges"][number]) => {
    const { from, to } = edge;
    return from.x === to.x ? "vertical" : "horizontal";
  };

  for (const mySegment of edges) {
    const mySegmentOrientation = edgeOrientation(mySegment);
    const findOverlappingParallelSegment = () =>
      otherEdges.find(
        (otherEdge) =>
          edgeOrientation(otherEdge) === mySegmentOrientation &&
          doesLineIntersectLine(
            [mySegment.from, mySegment.to],
            [otherEdge.from, otherEdge.to],
            {
              lineThickness: 0.05,
            },
          ),
      );
    let overlappingParallelSegmentFromOtherTrace =
      findOverlappingParallelSegment();
    while (overlappingParallelSegmentFromOtherTrace) {
      // Move my segment out of the way
      if (mySegmentOrientation === "horizontal") {
        mySegment.from.y += 0.1;
        mySegment.to.y += 0.1;
      } else {
        mySegment.from.x += 0.1;
        mySegment.to.x += 0.1;
      }
      overlappingParallelSegmentFromOtherTrace =
        findOverlappingParallelSegment();
      // TODO eventually push in the direction that makes the most sense to
      // reduce the number of intersections
    }
  }
};
