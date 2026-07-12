import { SCHEMATIC_COMPONENT_OUTLINE_COLOR } from "lib/utils/constants"
import type { SchSymbol } from "schematic-symbols"
import type { Mosfet } from "./Mosfet"

const symbolTextAnchorToCircuitJsonAnchor = {
  top_left: "top_left",
  top_right: "top_right",
  bottom_left: "bottom_left",
  bottom_right: "bottom_right",
  center: "center",
  middle_top: "top",
  middle_bottom: "bottom",
  middle_left: "left",
  middle_right: "right",
} as const

export const renderTransformedMosfetSymbol = (
  component: Mosfet,
  symbol: SchSymbol,
): { initialCenter: { x: number; y: number }; textIds: string[] } | null => {
  if (component.root?.schematicDisabled) return null

  const { db } = component.root!
  const center = component._getGlobalSchematicPositionBeforeLayout()
  const schematicSheetId = component._resolveSchematicSheetId()
  const subcircuitId = component.getSubcircuit()?.subcircuit_id ?? undefined
  const schematicComponent = db.schematic_component.insert({
    center,
    size: { ...symbol.size },
    source_component_id: component.source_component_id!,
    is_box_with_pins: false,
    symbol_display_value: component._getSchematicSymbolDisplayValue(),
    schematic_sheet_id: schematicSheetId,
  })
  component.schematic_component_id = schematicComponent.schematic_component_id

  const toGlobalPoint = (point: { x: number; y: number }) => ({
    x: center.x + point.x - symbol.center.x,
    y: center.y + point.y - symbol.center.y,
  })
  const textIds: string[] = []

  for (const primitive of symbol.primitives) {
    if (primitive.type === "path") {
      const points = primitive.points.map(toGlobalPoint)
      if (primitive.closed && points.length > 1) points.push({ ...points[0] })
      db.schematic_path.insert({
        schematic_component_id: schematicComponent.schematic_component_id,
        points,
        is_filled: primitive.fill ?? false,
        is_dashed: false,
        fill_color: primitive.fill
          ? SCHEMATIC_COMPONENT_OUTLINE_COLOR
          : undefined,
        stroke_color: SCHEMATIC_COMPONENT_OUTLINE_COLOR,
        stroke_width: primitive.strokeWidth ?? 0.02,
        subcircuit_id: subcircuitId,
        schematic_sheet_id: schematicSheetId,
      })
    } else if (primitive.type === "circle") {
      db.schematic_circle.insert({
        schematic_component_id: schematicComponent.schematic_component_id,
        center: toGlobalPoint(primitive),
        radius: primitive.radius,
        stroke_width: 0.02,
        color: SCHEMATIC_COMPONENT_OUTLINE_COLOR,
        is_filled: primitive.fill,
        fill_color: primitive.fill
          ? SCHEMATIC_COMPONENT_OUTLINE_COLOR
          : undefined,
        is_dashed: false,
        subcircuit_id: subcircuitId,
        schematic_sheet_id: schematicSheetId,
      })
    } else if (primitive.type === "box") {
      db.schematic_rect.insert({
        schematic_component_id: schematicComponent.schematic_component_id,
        center: toGlobalPoint({
          x: primitive.x + primitive.width / 2,
          y: primitive.y + primitive.height / 2,
        }),
        width: primitive.width,
        height: primitive.height,
        stroke_width: 0.02,
        color: SCHEMATIC_COMPONENT_OUTLINE_COLOR,
        is_filled: false,
        is_dashed: false,
        rotation: 0,
        subcircuit_id: subcircuitId,
        schematic_sheet_id: schematicSheetId,
      })
    } else {
      const text =
        primitive.text === "{REF}"
          ? (component._parsedProps.displayName ?? component.name ?? "")
          : primitive.text === "{VAL}"
            ? (component._getSchematicSymbolDisplayValue() ?? "")
            : primitive.text
      const schematicText = db.schematic_text.insert({
        text,
        anchor: symbolTextAnchorToCircuitJsonAnchor[primitive.anchor],
        position: toGlobalPoint(primitive),
        rotation: 0,
        color: "#000000",
        font_size: primitive.fontSize ?? 0.18,
        subcircuit_id: subcircuitId,
        schematic_sheet_id: schematicSheetId,
      })
      textIds.push(schematicText.schematic_text_id)
    }
  }

  return { initialCenter: center, textIds }
}
