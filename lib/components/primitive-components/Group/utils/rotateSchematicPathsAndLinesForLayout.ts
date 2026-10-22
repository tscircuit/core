import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { SchematicComponent } from "circuit-json"
import { applyToPoint, type Matrix } from "transformation-matrix"

/** Rotates path vertices and line endpoints in schematic world mm (+X right,
 * +Y up), using the same world-to-world placement transform as the ports. */
export function rotateSchematicPathsAndLinesForLayout({
  db,
  schematicComponentId,
  schematicLayoutRotation,
}: {
  db: CircuitJsonUtilObjects
  schematicComponentId: SchematicComponent["schematic_component_id"]
  schematicLayoutRotation: Matrix
}) {
  for (const line of db.schematic_line.list({
    schematic_component_id: schematicComponentId,
  })) {
    const start = applyToPoint(schematicLayoutRotation, {
      x: line.x1,
      y: line.y1,
    })
    const end = applyToPoint(schematicLayoutRotation, {
      x: line.x2,
      y: line.y2,
    })
    line.x1 = start.x
    line.y1 = start.y
    line.x2 = end.x
    line.y2 = end.y
  }
  for (const path of db.schematic_path.list({
    schematic_component_id: schematicComponentId,
  })) {
    path.points = path.points.map((point) =>
      applyToPoint(schematicLayoutRotation, point),
    )
  }
}
