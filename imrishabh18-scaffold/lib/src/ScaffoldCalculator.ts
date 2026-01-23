import { MoleculeProps } from "@tsci/imrishabh18.molecule"
import { MachineContactTypes } from "@tsci/imrishabh18.library"
import type { ArrayGridProps } from "lib/util/array-grid"

/**
 * Simplified ScaffoldBuilder Types
 *
 * ScaffoldBuilder is a smart wrapper around Molecule that:
 * - Auto-calculates size from grid dimensions
 * - Provides smart defaults for roundEdges (1mm) and debug (false)
 * - Supports "full" wing calculation based on contact type
 * - Passes children through to Molecule
 */

// Spacing can be either uniform (number) or separate X/Y (object)
export type GridSpacing =
  | number // Uniform spacing for both X and Y (e.g., 8)
  | { x: number; y: number } // Separate X and Y spacing

//export type Symmetry = "even" | "odd" | "even-odd" | "odd-even";

export interface GridConfig
  extends Pick<
    ArrayGridProps,
    "skipPattern" | "skipWhen" | "replacePattern" | "replaceWhen"
  > {
  contactType: MachineContactTypes // Type of machine contacts (Medium or Large)
  spacing: GridSpacing // Grid spacing - uniform or separate X/Y
  //symmetry?: Symmetry;
  cols?: number | "default" | `d${string}` | undefined // Number of columns, "default", "d", "d+N", "d-N" for relative defaults
  rows?: number | "default" | `d${string}` | undefined // Number of rows, "default", "d", "d+N", "d-N" for relative defaults
  shiftX?: number | undefined
  shiftY?: number | undefined
  skipPinOverlap?: boolean | number | undefined // Auto-skip contacts overlapping machine pins (true = auto threshold, number = custom distance in mm)
}

export interface ScaffoldProps extends Omit<MoleculeProps, "wing"> {
  // Contact grid configuration (used for size/wing calculations)
  contactGrid: GridConfig

  // Extended wing prop to support "full" = based on contact type spacing
  // Or {usable, nominal?} to explicitly separate usable vs nominal dimensions
  // nominal can be a number or "nominal" (-0.5)
  wing?:
    | string
    | number
    | "full"
    | { usable: number; nominal?: number | "nominal" }
}

export interface ScaffoldResult {
  // Grid configuration with normalized spacing
  contactGrid: {
    contactType: MachineContactTypes
    spacingX: number
    spacingY: number
    cols: number
    rows: number
    defaultCols: number // Auto-calculated default cols
    defaultRows: number // Auto-calculated default rows
    shiftX: number
    shiftY: number
    skipPinOverlap?: boolean | number // Pass through skipPinOverlap setting
  } & Pick<
    ArrayGridProps,
    "skipPattern" | "skipWhen" | "replacePattern" | "replaceWhen"
  >
  //   contactSize: 'Medium' | 'Large';

  // Size calculations
  nominalSizeX: number // Parsed from size string (e.g., 64 from "64x64")
  nominalSizeY: number // Parsed from size string (e.g., 64 from "64x64")
  //   boardSizeX: number;    // Nominal + wing spacing (e.g., 64 + 32 = 96)
  //   boardSizeY: number;    // Nominal + wing spacing (e.g., 64 + 32 = 96)
  contentsShiftX: number
  contentsShiftY: number

  // Wing calculation details
  wingInput:
    | string
    | number
    | "full"
    | { usable: number; nominal?: number | "nominal" }
    | undefined
  wingCalculated: MoleculeProps["wing"]
  wingSpacing: number | undefined // The spacing used for "full" calculation

  // Applied defaults
  appliedDefaults: {
    type: "2pin" | "4pin"
    roundEdges: MoleculeProps["roundEdges"]
    debug: boolean
    schematicDisabled: boolean
  }

  // Final molecule props ready for rendering
  moleculeProps: MoleculeProps
}

/**
 * Parse grid dimension value supporting relative default syntax
 *
 * @param value - The input value: number, "default", "d", "d+N", "d-N", or undefined
 * @param defaultValue - The calculated default value to use as base
 * @returns The final numeric value for cols or rows
 *
 * @example
 * parseGridDimension(5, 10) // returns 5
 * parseGridDimension("default", 10) // returns 10
 * parseGridDimension("d", 10) // returns 10
 * parseGridDimension("d+2", 10) // returns 12
 * parseGridDimension("d-1", 10) // returns 9
 */
export function parseGridDimension(
  value: number | "default" | `d${string}` | undefined,
  defaultValue: number,
): number {
  // Handle undefined or "default"
  if (value === undefined || value === "default") {
    return defaultValue
  }

  // Handle numeric value
  if (typeof value === "number") {
    return value
  }

  // Handle "d" patterns (string starting with 'd')
  if (typeof value === "string" && value.startsWith("d")) {
    // Just "d" means use default
    if (value === "d") {
      return defaultValue
    }

    // Match "d+N" or "d-N" patterns
    const match = value.match(/^d([+-]\d+)$/)
    if (match) {
      const offset = parseInt(match[1], 10)
      return defaultValue + offset
    }

    // Invalid pattern
    throw new Error(
      `Invalid grid dimension format: "${value}". ` +
        `Expected "d", "d+N", or "d-N" where N is an integer.`,
    )
  }

  // Fallback (should never reach here due to TypeScript types)
  return defaultValue
}

/**
 * Calculate scaffold configuration from ScaffoldProps
 *
 * Handles:
 * - Wing calculation when wing="full" based on contact type
 * - Default values for type, roundEdges, and debug
 *
 * @param props ScaffoldProps configuration
 * @returns ScaffoldResult with calculated values and metadata
 */
export function calculateScaffold(props: ScaffoldProps): ScaffoldResult {
  const { contactGrid, wing, ...moleculeProps } = props

  // Define standard grid spacings for each pin type
  const PIN_SPACING: Record<string, number> = {
    MachinePinMediumStandard: 8, // 8mm grid for Medium pins
    MachinePinMediumShort: 8, // 8mm grid for Medium pins
    MachinePinLargeStandard: 32, // 32mm grid for Large pins
  }

  const baseSpacing = props.pinType ? PIN_SPACING[props.pinType] : undefined
  if (!baseSpacing) {
    throw new Error(
      `Invalid or missing pinType "${props.pinType}". ` +
        `Expected "MachinePinMediumStandard", "MachinePinMediumShort", or "MachinePinLargeStandard".`,
    )
  }

  // Normalize spacing to always have spacingX and spacingY
  const spacingX =
    typeof contactGrid.spacing === "number"
      ? contactGrid.spacing
      : contactGrid.spacing.x
  const spacingY =
    typeof contactGrid.spacing === "number"
      ? contactGrid.spacing
      : contactGrid.spacing.y

  // Parse size string (e.g., "64x64" or "64x64 absolute")
  const sizeStr = props.size
  const parts = sizeStr.split(" ")
  const dimensions = parts[0].split("x")
  const baseSizeX = parseInt(dimensions[0], 10)
  const baseSizeY = parseInt(dimensions[1], 10)

  // Calculate wing - "full" means based on contact type spacing
  let finalWing: MoleculeProps["wing"]
  let wingSpacing: number | undefined

  if (wing === "full") {
    wingSpacing = baseSpacing
    finalWing = `${baseSpacing / 2 - 0.5} absolute`
  } else if (typeof wing === "object" && wing !== null && "usable" in wing) {
    // Handle {usable, nominal?} format
    // usable * 2: added to nominal size calculation (wing applies to both sides)
    // usable + nominal: total wing passed to Molecule (nominal defaults to 0)
    // nominal can be a number or "nominal" (-0.5)
    wingSpacing = wing.usable * 2
    const nominalValue = wing.nominal === "nominal" ? -0.5 : (wing.nominal ?? 0)
    finalWing = `${wing.usable + nominalValue} absolute`
  } else if (wing !== undefined) {
    finalWing = wing
    wingSpacing = undefined
  } else {
    finalWing = "nominal"
    wingSpacing = undefined
  }

  // Calculate board size: nominal + wing spacing (no adjustments)
  // When wingSpacing is defined (for "full" or {usable, nominal}), use it
  // Otherwise use baseSpacing
  const nominalSizeX =
    baseSizeX + (wingSpacing !== undefined ? wingSpacing : baseSpacing)
  const nominalSizeY =
    baseSizeY + (wingSpacing !== undefined ? wingSpacing : baseSpacing)

  const contentsShiftX = -(nominalSizeX / 2) + 2
  const contentsShiftY = -(nominalSizeY / 2) + 2

  // Apply defaults
  const finalType = props.type ?? "4pin"
  const finalRoundEdges = props.roundEdges !== undefined ? props.roundEdges : 1
  const finalDebug = props.debug ?? false
  const finalSchematicDisabled = props.schematicDisabled ?? true

  // Calculate default cols/rows based on nominal size and spacing
  const defaultCols = Math.floor(nominalSizeX / spacingX)
  const defaultRows = Math.floor(nominalSizeY / spacingY)
  const finalCols = parseGridDimension(contactGrid.cols, defaultCols)
  const finalRows = parseGridDimension(contactGrid.rows, defaultRows)

  // Build scaffold result object
  const scafObj: ScaffoldResult = {
    contactGrid: {
      contactType: contactGrid.contactType,
      spacingX: spacingX,
      spacingY: spacingY,
      cols: finalCols,
      rows: finalRows,
      defaultCols: defaultCols,
      defaultRows: defaultRows,
      shiftX: contactGrid.shiftX ?? 0,
      shiftY: contactGrid.shiftY ?? 0,
      skipPinOverlap: contactGrid.skipPinOverlap,
      skipPattern: contactGrid.skipPattern,
      skipWhen: contactGrid.skipWhen,
      replacePattern: contactGrid.replacePattern,
      replaceWhen: contactGrid.replaceWhen,
    },
    //contactSize: contactSize,
    nominalSizeX: nominalSizeX,
    nominalSizeY: nominalSizeY,
    contentsShiftX: contentsShiftX,
    contentsShiftY: contentsShiftY,

    // boardSizeX: boardSizeX,
    // boardSizeY: boardSizeY,
    wingInput: wing,
    wingCalculated: finalWing,
    wingSpacing: wingSpacing,
    appliedDefaults: {
      type: finalType,
      roundEdges: finalRoundEdges,
      debug: finalDebug,
      schematicDisabled: finalSchematicDisabled,
    },
    moleculeProps: {
      ...moleculeProps,
      type: finalType,
      wing: finalWing,
      roundEdges: finalRoundEdges,
      debug: finalDebug,
      schematicDisabled: finalSchematicDisabled,
    },
  }

  return scafObj
}
