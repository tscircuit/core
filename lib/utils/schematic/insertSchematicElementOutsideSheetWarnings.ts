import {
  type CircuitJsonUtilObjects,
  type SchematicElementWithBounds,
  getSchematicElementBounds,
} from "@tscircuit/circuit-json-util"
import type { SchematicSheetSize } from "circuit-json"

type Point = { x: number; y: number }

type CheckedSchematicElement = SchematicElementWithBounds

const SCHEMATIC_UNIT_TO_MM = 10.16 / 1.1
const SCHEMATIC_SHEET_DIMENSIONS_MM: Record<
  SchematicSheetSize,
  { width: number; height: number }
> = {
  a4: { width: 297, height: 210 },
  ansi_b: { width: 431.8, height: 279.4 },
}
export const DEFAULT_SCHEMATIC_SHEET_WIDTH =
  SCHEMATIC_SHEET_DIMENSIONS_MM.a4.width / SCHEMATIC_UNIT_TO_MM
export const DEFAULT_SCHEMATIC_SHEET_HEIGHT =
  SCHEMATIC_SHEET_DIMENSIONS_MM.a4.height / SCHEMATIC_UNIT_TO_MM
const SCHEMATIC_SHEET_INNER_MARGIN = 5 / SCHEMATIC_UNIT_TO_MM

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

export const insertSchematicElementOutsideSheetWarnings = ({
  db,
  schematicSheetId,
  schematicSheetName,
  schematicSheetCenter,
  sheetSize = "a4",
  sheetWidth,
  sheetHeight,
}: {
  db: CircuitJsonUtilObjects
  schematicSheetId: string
  schematicSheetName: string
  schematicSheetCenter: Point
  sheetSize?: SchematicSheetSize
  sheetWidth?: number
  sheetHeight?: number
}): void => {
  const sheetDimensions = SCHEMATIC_SHEET_DIMENSIONS_MM[sheetSize]
  const sheetWidthInSchematicUnits =
    (sheetWidth ?? sheetDimensions.width) / SCHEMATIC_UNIT_TO_MM
  const sheetHeightInSchematicUnits =
    (sheetHeight ?? sheetDimensions.height) / SCHEMATIC_UNIT_TO_MM
  const sheetContentBounds = {
    minX:
      schematicSheetCenter.x -
      sheetWidthInSchematicUnits / 2 +
      SCHEMATIC_SHEET_INNER_MARGIN,
    maxX:
      schematicSheetCenter.x +
      sheetWidthInSchematicUnits / 2 -
      SCHEMATIC_SHEET_INNER_MARGIN,
    minY:
      schematicSheetCenter.y -
      sheetHeightInSchematicUnits / 2 +
      SCHEMATIC_SHEET_INNER_MARGIN,
    maxY:
      schematicSheetCenter.y +
      sheetHeightInSchematicUnits / 2 -
      SCHEMATIC_SHEET_INNER_MARGIN,
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
