import {
  type CircuitJsonUtilObjects,
  transformSchematicElements,
} from "@tscircuit/circuit-json-util"
import type { SchematicSheet } from "circuit-json"
import { getBoundsForSchematic } from "lib/utils/autorouting/getBoundsForSchematic"
import {
  DEFAULT_SCHEMATIC_SHEET_HEIGHT,
  DEFAULT_SCHEMATIC_SHEET_WIDTH,
  SCHEMATIC_SHEET_INNER_MARGIN,
} from "lib/utils/schematic/insertSchematicElementOutsideSheetWarnings"
import { applyToPoint, translate } from "transformation-matrix"

type SchematicSheetId = SchematicSheet["schematic_sheet_id"]

export const moveSchematicSheetContentsInsideFrame = ({
  db,
  schematicSheetId,
}: {
  db: CircuitJsonUtilObjects
  schematicSheetId: SchematicSheetId
}): void => {
  const schematicSheetFilter = { schematic_sheet_id: schematicSheetId }
  const schematicElements = [
    ...db.schematic_component.list(schematicSheetFilter),
    ...db.schematic_port.list(schematicSheetFilter),
    ...db.schematic_text.list(schematicSheetFilter),
    ...db.schematic_line.list(schematicSheetFilter),
    ...db.schematic_rect.list(schematicSheetFilter),
    ...db.schematic_circle.list(schematicSheetFilter),
    ...db.schematic_arc.list(schematicSheetFilter),
    ...db.schematic_path.list(schematicSheetFilter),
  ]

  if (schematicElements.length === 0) return

  const bounds = getBoundsForSchematic(schematicElements)
  if (
    !Number.isFinite(bounds.minX) ||
    !Number.isFinite(bounds.maxX) ||
    !Number.isFinite(bounds.minY) ||
    !Number.isFinite(bounds.maxY)
  ) {
    return
  }

  const sheetMinX =
    -DEFAULT_SCHEMATIC_SHEET_WIDTH / 2 + SCHEMATIC_SHEET_INNER_MARGIN
  const sheetMaxX =
    DEFAULT_SCHEMATIC_SHEET_WIDTH / 2 - SCHEMATIC_SHEET_INNER_MARGIN
  const sheetMinY =
    -DEFAULT_SCHEMATIC_SHEET_HEIGHT / 2 + SCHEMATIC_SHEET_INNER_MARGIN
  const sheetMaxY =
    DEFAULT_SCHEMATIC_SHEET_HEIGHT / 2 - SCHEMATIC_SHEET_INNER_MARGIN

  const contentFitsInsideSheet =
    bounds.maxX - bounds.minX <= sheetMaxX - sheetMinX &&
    bounds.maxY - bounds.minY <= sheetMaxY - sheetMinY
  if (!contentFitsInsideSheet) return

  let translateX = 0
  let translateY = 0
  if (bounds.minX < sheetMinX) translateX = sheetMinX - bounds.minX
  else if (bounds.maxX > sheetMaxX) translateX = sheetMaxX - bounds.maxX
  if (bounds.minY < sheetMinY) translateY = sheetMinY - bounds.minY
  else if (bounds.maxY > sheetMaxY) translateY = sheetMaxY - bounds.maxY

  if (translateX === 0 && translateY === 0) return

  const schematicIntoFrameTransform = translate(translateX, translateY)

  transformSchematicElements(
    [
      ...schematicElements,
      ...db.schematic_net_label.list(schematicSheetFilter),
      ...db.schematic_trace.list(schematicSheetFilter),
    ],
    schematicIntoFrameTransform,
  )

  for (const element of [
    ...db.schematic_rect.list(schematicSheetFilter),
    ...db.schematic_circle.list(schematicSheetFilter),
    ...db.schematic_arc.list(schematicSheetFilter),
  ]) {
    element.center = applyToPoint(schematicIntoFrameTransform, element.center)
  }

  for (const path of db.schematic_path.list(schematicSheetFilter)) {
    path.points = path.points.map((point) =>
      applyToPoint(schematicIntoFrameTransform, point),
    )
  }

  for (const netLabel of db.schematic_net_label.list(schematicSheetFilter)) {
    netLabel.center = applyToPoint(schematicIntoFrameTransform, netLabel.center)
    if (netLabel.anchor_position) {
      netLabel.anchor_position = applyToPoint(
        schematicIntoFrameTransform,
        netLabel.anchor_position,
      )
    }
  }
}
