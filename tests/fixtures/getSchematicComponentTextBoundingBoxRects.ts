import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { SchematicRect } from "circuit-json"
import {
  getBoundFromCenteredRect,
  getBoundsCenter,
} from "@tscircuit/math-utils"
import { getSchematicComponentWithTextBounds } from "lib/utils/schematic/getSchematicComponentWithTextBounds"

export function getSchematicComponentTextBoundingBoxRects(
  db: CircuitJsonUtilObjects,
): SchematicRect[] {
  const rects: SchematicRect[] = []

  for (const schematicComponent of db.schematic_component.list()) {
    if (!schematicComponent.center || !schematicComponent.size) continue

    const bounds =
      getSchematicComponentWithTextBounds({ db, schematicComponent }) ??
      getBoundFromCenteredRect({
        center: schematicComponent.center,
        width: schematicComponent.size.width,
        height: schematicComponent.size.height,
      })

    rects.push({
      type: "schematic_rect",
      schematic_rect_id: `text_bbox_${schematicComponent.schematic_component_id}`,
      schematic_component_id: schematicComponent.schematic_component_id,
      center: getBoundsCenter(bounds),
      width: bounds.maxX - bounds.minX,
      height: bounds.maxY - bounds.minY,
      rotation: 0,
      color: "red",
      is_filled: false,
      is_dashed: true,
      stroke_width: 0.02,
    })
  }

  return rects
}
