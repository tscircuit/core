import {
  type CircuitJsonUtilObjects,
  type SchematicElementWithBounds,
  getSchematicElementBounds,
} from "@tscircuit/circuit-json-util"
type Point = { x: number; y: number }

type CheckedSchematicElement = SchematicElementWithBounds

const SCHEMATIC_UNIT_TO_MM = 10.16 / 1.1
const SCHEMATIC_SHEET_INNER_MARGIN = 5 / SCHEMATIC_UNIT_TO_MM

export const getSchematicSheetDrawingDimensions = ({
  sheetWidth,
  sheetHeight,
}: {
  sheetWidth: number
  sheetHeight: number
}): { width: number; height: number } => ({
  width: Math.max(
    0,
    sheetWidth / SCHEMATIC_UNIT_TO_MM - SCHEMATIC_SHEET_INNER_MARGIN * 2,
  ),
  height: Math.max(
    0,
    sheetHeight / SCHEMATIC_UNIT_TO_MM - SCHEMATIC_SHEET_INNER_MARGIN * 2,
  ),
})

const BOUNDS_EPSILON = 1e-6

const getSchematicElementId = (
  schematicElement: CheckedSchematicElement,
): string => {
  switch (schematicElement.type) {
    case "schematic_component":
      return schematicElement.schematic_component_id
    case "schematic_net_label":
      return schematicElement.schematic_net_label_id
    case "schematic_trace":
      return schematicElement.schematic_trace_id
  }
}

export const warnIfSchematicElementsOutsideSheet = ({
  db,
  schematicSheetId,
  schematicSheetName,
  schematicSheetCenter,
  sheetWidth,
  sheetHeight,
}: {
  db: CircuitJsonUtilObjects
  schematicSheetId: string
  schematicSheetName: string
  schematicSheetCenter: Point
  sheetWidth: number
  sheetHeight: number
}): void => {
  const drawingDimensions = getSchematicSheetDrawingDimensions({
    sheetWidth,
    sheetHeight,
  })
  const sheetContentBounds = {
    minX: schematicSheetCenter.x - drawingDimensions.width / 2,
    maxX: schematicSheetCenter.x + drawingDimensions.width / 2,
    minY: schematicSheetCenter.y - drawingDimensions.height / 2,
    maxY: schematicSheetCenter.y + drawingDimensions.height / 2,
  }
  const checkedElements: CheckedSchematicElement[] = [
    ...db.schematic_component.list(),
    ...db.schematic_net_label.list(),
    ...db.schematic_trace.list(),
  ].filter(
    (schematicElement) =>
      schematicElement.schematic_sheet_id === schematicSheetId,
  )

  for (const schematicElement of checkedElements) {
    const elementBounds = getSchematicElementBounds(schematicElement)
    if (!elementBounds) continue

    const isOutsideSheet =
      elementBounds.minX < sheetContentBounds.minX - BOUNDS_EPSILON ||
      elementBounds.maxX > sheetContentBounds.maxX + BOUNDS_EPSILON ||
      elementBounds.minY < sheetContentBounds.minY - BOUNDS_EPSILON ||
      elementBounds.maxY > sheetContentBounds.maxY + BOUNDS_EPSILON
    if (!isOutsideSheet) continue

    const schematicElementId = getSchematicElementId(schematicElement)
    db.schematic_element_outside_sheet_warning.insert({
      warning_type: "schematic_element_outside_sheet_warning",
      message: `${schematicElement.type} ${schematicElementId} extends outside the drawing area of schematic sheet "${schematicSheetName}"`,
      schematic_sheet_id: schematicSheetId,
      schematic_element_type: schematicElement.type,
      schematic_element_id: schematicElementId,
    })
  }
}
