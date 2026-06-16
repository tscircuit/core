import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { SchematicRect } from "circuit-json"
import { getSchematicComponentBoxTextPadding } from "lib/utils/schematic/getSchematicComponentTextPadding"

export function getSchematicComponentTextBoundingBoxRects(
  db: CircuitJsonUtilObjects,
): SchematicRect[] {
  const rects: SchematicRect[] = []

  for (const schematicComponent of db.schematic_component.list()) {
    if (!schematicComponent.center || !schematicComponent.size) continue

    const pad = getSchematicComponentBoxTextPadding(db, schematicComponent)

    rects.push({
      type: "schematic_rect",
      schematic_rect_id: `text_bbox_${schematicComponent.schematic_component_id}`,
      schematic_component_id: schematicComponent.schematic_component_id,
      center: {
        x: schematicComponent.center.x + (pad.right - pad.left) / 2,
        y: schematicComponent.center.y + (pad.top - pad.bottom) / 2,
      },
      width: schematicComponent.size.width + pad.left + pad.right,
      height: schematicComponent.size.height + pad.top + pad.bottom,
      rotation: 0,
      color: "red",
      is_filled: false,
      is_dashed: true,
      stroke_width: 0.02,
    })
  }

  return rects
}
