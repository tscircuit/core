import { ScaffoldBuilder, ScaffoldProps } from "./src/ScaffoldBuilder"
import type { MoleculeSizeString } from "@tsci/imrishabh18.molecule"
import type { ReactNode } from "react"

export type { ScaffoldProps, ScaffoldResult } from "./src/ScaffoldBuilder"

/**
 * Common props interface for all scaffold templates.
 * Specific templates may have different default values.
 */
export interface ScaffoldTemplateProps {
  /** Board size string (e.g., "64x64", "128x128", "224x224") */
  size?: MoleculeSizeString

  /** Wing configuration */
  wing?:
    | string
    | number
    | "full"
    | { usable: number; nominal?: number | "nominal" }

  /** Grid spacing in mm */
  spacing?: number

  /** Auto-skip contacts overlapping machine pins */
  skipPinOverlap?: boolean | number

  /** Enable debug visualization */
  debug?: boolean

  /** Optional children to add to the scaffold */
  children?: ReactNode
}

/**
 * Scaffold Component - Main export for scaffold creation
 *
 * Usage:
 * ```tsx
 * <Scaffold
 *   scaffoldType="Lrg_Med"
 *   gridSpacing={8}
 *   gridCols={12}
 *   gridRows={12}
 *   secondaryGridCols={11}
 *   secondaryGridRows={11}
 *   includeCornerSlots={true}
 * />
 * ```
 */
export const Scaffold = (props: ScaffoldProps) => {
  return <ScaffoldBuilder {...props} />
}
