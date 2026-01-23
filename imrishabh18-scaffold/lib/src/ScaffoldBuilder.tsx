import React from "react"
import { Molecule } from "@tsci/imrishabh18.molecule"
import { ScaffoldProps, calculateScaffold } from "./ScaffoldCalculator"
import { calculateMolecule } from "@tsci/imrishabh18.molecule"

export type { ScaffoldProps, ScaffoldResult } from "./ScaffoldCalculator"

import {
  MachineContactMedium,
  MachineContactLarge,
} from "@tsci/imrishabh18.library"
import { ArrayGrid } from "lib/util/array-grid"

/**
 * ScaffoldBuilder Component
 *
 * A simplified wrapper around Molecule that:
 * - Auto-calculates board size from grid dimensions
 * - Provides smart defaults for roundEdges (1mm) and debug (false)
 * - Supports "full" wing calculation based on contact type
 * - Passes all other Molecule props through
 */
export const ScaffoldBuilder = (props: ScaffoldProps) => {
  // Calculate scaffold configuration (wing sizing, defaults, etc.)
  const scaffoldResult = calculateScaffold(props)

  // Pre-calculate moleculeResult to access machine pin positions for skipPinOverlap
  const moleculeResult = calculateMolecule(scaffoldResult.moleculeProps)

  // Create enhanced skipWhen function that includes pin overlap detection
  const enhancedSkipWhen = (point: {
    x: number
    y: number
    index: number
    gridIndex: number
    row: number
    col: number
    totalRows: number
    totalCols: number
  }) => {
    // Check original skipWhen first
    if (
      scaffoldResult.contactGrid.skipWhen &&
      scaffoldResult.contactGrid.skipWhen(point)
    ) {
      return true
    }

    // Check pin overlap if enabled
    if (
      scaffoldResult.contactGrid.skipPinOverlap &&
      moleculeResult.machinePins
    ) {
      // Determine overlap threshold
      const threshold =
        typeof scaffoldResult.contactGrid.skipPinOverlap === "number"
          ? scaffoldResult.contactGrid.skipPinOverlap
          : scaffoldResult.contactGrid.contactType === "MachineContactMedium"
            ? 2 // 2mm for Medium contacts
            : 6 // 6mm for Large contacts

      // Check distance from each machine pin
      return moleculeResult.machinePins.some((pin) => {
        const dx = point.x - pin.x
        const dy = point.y - pin.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        return distance < threshold
      })
    }

    return false
  }

  // Clone children and inject scaffoldResult, moleculeResult, and debug props
  const childrenWithScaffoldResult = React.Children.map(
    props.children,
    (child) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child, {
          scaffoldResult: scaffoldResult,
          moleculeResult: moleculeResult,
          debug: scaffoldResult.appliedDefaults.debug,
        } as any)
      }
      return child
    },
  )

  return (
    <Molecule {...scaffoldResult.moleculeProps}>
      <ArrayGrid
        cols={scaffoldResult.contactGrid.cols}
        rows={scaffoldResult.contactGrid.rows}
        spacingX={scaffoldResult.contactGrid.spacingX}
        spacingY={scaffoldResult.contactGrid.spacingY}
        anchor="center"
        startX={0}
        startY={0}
        // startX={scaffoldResult.contentsShiftX + (scaffoldResult.contactGrid.shiftX ?? 0)}
        // startY={scaffoldResult.contentsShiftY + (scaffoldResult.contactGrid.shiftY ?? 0)}
        startIndex={1}
        skipPattern={scaffoldResult.contactGrid.skipPattern}
        skipWhen={enhancedSkipWhen}
        replacePattern={scaffoldResult.contactGrid.replacePattern}
        replaceWhen={scaffoldResult.contactGrid.replaceWhen}
      >
        {(point) => {
          const ContactComponent =
            scaffoldResult.contactGrid.contactType === "MachineContactMedium"
              ? MachineContactMedium
              : MachineContactLarge

          return (
            <ContactComponent
              pcbX={point.x}
              pcbY={point.y}
              name={`MC${point.index}`}
            />
          )
        }}
      </ArrayGrid>

      {childrenWithScaffoldResult}
    </Molecule>
  )
}
