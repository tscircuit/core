import type { SchematicSheetSize as PropsSchematicSheetSize } from "@tscircuit/props"
import {
  type SchematicSheetSize as CircuitJsonSchematicSheetSize,
  schematic_sheet_size,
} from "circuit-json"

export const getCircuitJsonSchematicSheetSize = (
  sheetSize: PropsSchematicSheetSize,
): CircuitJsonSchematicSheetSize =>
  schematic_sheet_size.parse(sheetSize.toLowerCase())

const SCHEMATIC_SHEET_DIMENSIONS_MM: Record<
  CircuitJsonSchematicSheetSize,
  { width: number; height: number }
> = {
  a4: { width: 297, height: 210 },
  ansi_b: { width: 431.8, height: 279.4 },
}

export const resolveCircuitJsonSchematicSheetProperties = ({
  sheetSize,
  sheetWidth,
  sheetHeight,
}: {
  sheetSize: PropsSchematicSheetSize
  sheetWidth?: number
  sheetHeight?: number
}): {
  sheetSize: CircuitJsonSchematicSheetSize
  sheetWidth: number
  sheetHeight: number
} => {
  const circuitJsonSheetSize = getCircuitJsonSchematicSheetSize(sheetSize)
  const defaultDimensions = SCHEMATIC_SHEET_DIMENSIONS_MM[circuitJsonSheetSize]

  return {
    sheetSize: circuitJsonSheetSize,
    sheetWidth: sheetWidth ?? defaultDimensions.width,
    sheetHeight: sheetHeight ?? defaultDimensions.height,
  }
}
