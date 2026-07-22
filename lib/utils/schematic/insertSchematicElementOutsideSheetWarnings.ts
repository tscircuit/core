import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type {
  AnyCircuitElementInput,
  SchematicComponent,
  SchematicNetLabel,
  SchematicTrace,
} from "circuit-json"
import { getSchematicNetLabelTextWidth } from "./computeSchematicNetLabelCenter"

type Point = { x: number; y: number }

type SchematicElementBounds = {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

type CheckedSchematicElement =
  | SchematicComponent
  | SchematicNetLabel
  | SchematicTrace

// This named boundary type can be replaced by the Circuit JSON export after
// tscircuit/circuit-json#658 is released.
type SchematicElementOutsideSheetWarningInput = {
  type: "schematic_element_outside_sheet_warning"
  warning_type: "schematic_element_outside_sheet_warning"
  message: string
  schematic_sheet_id: string
  schematic_element_type: CheckedSchematicElement["type"]
  schematic_element_id: string
}

// These dimensions match circuit-to-svg's A4 landscape schematic sheet.
const SCHEMATIC_UNIT_TO_MM = 10.16 / 1.1
export const DEFAULT_SCHEMATIC_SHEET_WIDTH = 297 / SCHEMATIC_UNIT_TO_MM
export const DEFAULT_SCHEMATIC_SHEET_HEIGHT = 210 / SCHEMATIC_UNIT_TO_MM
const SCHEMATIC_SHEET_INNER_MARGIN = 5 / SCHEMATIC_UNIT_TO_MM

const SCHEMATIC_TRACE_HALF_WIDTH = 0.05
const SCHEMATIC_NET_LABEL_HEIGHT = 0.2
const BOUNDS_EPSILON = 1e-6

const getSchematicNetLabelBounds = (
  schematicNetLabel: SchematicNetLabel,
): SchematicElementBounds => {
  const labelLength = getSchematicNetLabelTextWidth({
    text: schematicNetLabel.text,
  })
  const anchor = schematicNetLabel.anchor_position

  if (!anchor) {
    const isVertical =
      schematicNetLabel.anchor_side === "top" ||
      schematicNetLabel.anchor_side === "bottom"
    const width = isVertical ? SCHEMATIC_NET_LABEL_HEIGHT : labelLength
    const height = isVertical ? labelLength : SCHEMATIC_NET_LABEL_HEIGHT
    return {
      minX: schematicNetLabel.center.x - width / 2,
      maxX: schematicNetLabel.center.x + width / 2,
      minY: schematicNetLabel.center.y - height / 2,
      maxY: schematicNetLabel.center.y + height / 2,
    }
  }

  switch (schematicNetLabel.anchor_side) {
    case "left":
      return {
        minX: anchor.x,
        maxX: anchor.x + labelLength,
        minY: anchor.y - SCHEMATIC_NET_LABEL_HEIGHT / 2,
        maxY: anchor.y + SCHEMATIC_NET_LABEL_HEIGHT / 2,
      }
    case "right":
      return {
        minX: anchor.x - labelLength,
        maxX: anchor.x,
        minY: anchor.y - SCHEMATIC_NET_LABEL_HEIGHT / 2,
        maxY: anchor.y + SCHEMATIC_NET_LABEL_HEIGHT / 2,
      }
    case "top":
      return {
        minX: anchor.x - SCHEMATIC_NET_LABEL_HEIGHT / 2,
        maxX: anchor.x + SCHEMATIC_NET_LABEL_HEIGHT / 2,
        minY: anchor.y - labelLength,
        maxY: anchor.y,
      }
    case "bottom":
      return {
        minX: anchor.x - SCHEMATIC_NET_LABEL_HEIGHT / 2,
        maxX: anchor.x + SCHEMATIC_NET_LABEL_HEIGHT / 2,
        minY: anchor.y,
        maxY: anchor.y + labelLength,
      }
  }
}

const getSchematicElementBounds = (
  schematicElement: CheckedSchematicElement,
): SchematicElementBounds | null => {
  if (schematicElement.type === "schematic_component") {
    return {
      minX: schematicElement.center.x - schematicElement.size.width / 2,
      maxX: schematicElement.center.x + schematicElement.size.width / 2,
      minY: schematicElement.center.y - schematicElement.size.height / 2,
      maxY: schematicElement.center.y + schematicElement.size.height / 2,
    }
  }

  if (schematicElement.type === "schematic_net_label") {
    return getSchematicNetLabelBounds(schematicElement)
  }

  const points = [
    ...schematicElement.edges.flatMap((edge) => [edge.from, edge.to]),
    ...schematicElement.junctions,
  ]
  if (points.length === 0) return null

  return {
    minX:
      Math.min(...points.map((point) => point.x)) - SCHEMATIC_TRACE_HALF_WIDTH,
    maxX:
      Math.max(...points.map((point) => point.x)) + SCHEMATIC_TRACE_HALF_WIDTH,
    minY:
      Math.min(...points.map((point) => point.y)) - SCHEMATIC_TRACE_HALF_WIDTH,
    maxY:
      Math.max(...points.map((point) => point.y)) + SCHEMATIC_TRACE_HALF_WIDTH,
  }
}

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
}: {
  db: CircuitJsonUtilObjects
  schematicSheetId: string
  schematicSheetName: string
  schematicSheetCenter: Point
}): void => {
  const sheetContentBounds = {
    minX:
      schematicSheetCenter.x -
      DEFAULT_SCHEMATIC_SHEET_WIDTH / 2 +
      SCHEMATIC_SHEET_INNER_MARGIN,
    maxX:
      schematicSheetCenter.x +
      DEFAULT_SCHEMATIC_SHEET_WIDTH / 2 -
      SCHEMATIC_SHEET_INNER_MARGIN,
    minY:
      schematicSheetCenter.y -
      DEFAULT_SCHEMATIC_SHEET_HEIGHT / 2 +
      SCHEMATIC_SHEET_INNER_MARGIN,
    maxY:
      schematicSheetCenter.y +
      DEFAULT_SCHEMATIC_SHEET_HEIGHT / 2 -
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
    const warning: SchematicElementOutsideSheetWarningInput = {
      type: "schematic_element_outside_sheet_warning",
      warning_type: "schematic_element_outside_sheet_warning",
      message: `${schematicElement.type} ${schematicElementId} extends outside the drawing area of schematic sheet "${schematicSheetName}"`,
      schematic_sheet_id: schematicSheetId,
      schematic_element_type: schematicElement.type,
      schematic_element_id: schematicElementId,
    }
    db.insert(warning as unknown as AnyCircuitElementInput)
  }
}
