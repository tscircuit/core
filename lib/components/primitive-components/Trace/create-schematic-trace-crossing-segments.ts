import type { SoupUtilObjects } from "@tscircuit/soup-util"
import type { SchematicTrace } from "circuit-json"

/**
 *  Find all intersections between myEdges and all otherEdges and create a
 *  segment representing the crossing. Wherever there's a crossing, we create
 *  3 new edges. The middle edge has `is_crossing: true` and is 0.01mm wide
 */
export const createSchematicTraceCrossingSegments = ({
  edges,
  db,
}: {
  edges: SchematicTrace["edges"]
  db: SoupUtilObjects
}) => {
  // TODO
}
