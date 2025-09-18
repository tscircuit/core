import type { SchematicTrace } from "circuit-json";
import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util";
import { doesLineIntersectLine } from "@tscircuit/math-utils";
import { getOtherSchematicTraces } from "./get-other-schematic-traces";
import {
  getNetLabelBounds,
  doesSegmentIntersectNetLabel,
  calculateRequiredMovement,
  type NetLabelBounds,
} from "lib/utils/schematic/getNetLabelBounds";

/**
 *  Check if these edges run along any other schematic traces or through netlabels,
 *  if they do push them out of the way
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

  // Get all netlabels to check for collisions
  const netlabels = db.schematic_net_label.list();
  const netlabelBounds = netlabels.map((label) => ({
    label,
    bounds: getNetLabelBounds(label),
  }));

  for (const mySegment of edges) {
    const mySegmentOrientation = edgeOrientation(mySegment);

    // Check for trace-to-trace overlaps
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

    // Check for netlabel collisions
    const findCollidingNetLabel = () =>
      netlabelBounds.find(({ bounds }) =>
        doesSegmentIntersectNetLabel(mySegment, bounds),
      );

    let collidingNetLabel = findCollidingNetLabel();
    while (collidingNetLabel) {
      // Calculate the exact movement needed to clear the collision
      const requiredMovement = calculateRequiredMovement(
        mySegment,
        collidingNetLabel.bounds,
      );

      if (requiredMovement) {
        switch (requiredMovement.direction) {
          case "up":
            mySegment.from.y += requiredMovement.distance;
            mySegment.to.y += requiredMovement.distance;
            break;
          case "down":
            mySegment.from.y -= requiredMovement.distance;
            mySegment.to.y -= requiredMovement.distance;
            break;
          case "right":
            mySegment.from.x += requiredMovement.distance;
            mySegment.to.x += requiredMovement.distance;
            break;
          case "left":
            mySegment.from.x -= requiredMovement.distance;
            mySegment.to.x -= requiredMovement.distance;
            break;
        }
      } else {
        // Fallback to old behavior if calculation fails
        if (mySegmentOrientation === "horizontal") {
          const netLabelCenterY = collidingNetLabel.label.center.y;
          const segmentY = mySegment.from.y;
          if (segmentY > netLabelCenterY) {
            mySegment.from.y += 0.15;
            mySegment.to.y += 0.15;
          } else {
            mySegment.from.y -= 0.15;
            mySegment.to.y -= 0.15;
          }
        } else {
          const netLabelCenterX = collidingNetLabel.label.center.x;
          const segmentX = mySegment.from.x;
          if (segmentX > netLabelCenterX) {
            mySegment.from.x += 0.15;
            mySegment.to.x += 0.15;
          } else {
            mySegment.from.x -= 0.15;
            mySegment.to.x -= 0.15;
          }
        }
      }

      // Update bounds and check again
      netlabelBounds.forEach((entry) => {
        entry.bounds = getNetLabelBounds(entry.label);
      });
      collidingNetLabel = findCollidingNetLabel();
    }
  }
};
