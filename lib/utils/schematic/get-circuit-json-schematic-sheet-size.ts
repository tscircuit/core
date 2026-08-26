import type { SchematicSheetSize as PropsSchematicSheetSize } from "@tscircuit/props"
import {
  type SchematicSheetSize as CircuitJsonSchematicSheetSize,
  schematic_sheet_size,
} from "circuit-json"

export const getCircuitJsonSchematicSheetSize = (
  sheetSize: PropsSchematicSheetSize,
): CircuitJsonSchematicSheetSize =>
  schematic_sheet_size.parse(sheetSize.toLowerCase())
