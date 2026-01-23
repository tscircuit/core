import { ScaffoldBuilder } from "../../src/ScaffoldBuilder"
import type { ScaffoldResult } from "../../src/ScaffoldCalculator"
import type { ScaffoldTemplateProps } from "../../ScaffoldTemplate"
import type { ReactNode } from "react"

import { ArrayGrid } from "../../util/array-grid"
import {
  Scaffold_Slot_Lrg_Single,
  Scaffold_Slot_Lrg_X_Set,
  Scaffold_Slot_Med_X_Combined_Set,
} from "../../src/ScaffoldSlots"

/**
 * Reusable Large/Large Scaffold Component
 *
 * A simplified scaffold for Large machine pins with Large contacts.
 * Provides sensible defaults while allowing customization.
 *
 * Default configuration:
 * - Size: 224x224mm
 * - Pin Type: MachinePinLargeStandard
 * - Contact Type: MachineContactLarge
 * - Spacing: 32mm grid
 * - Wing: 16mm usable + nominal tolerance
 * - Auto-skips contacts overlapping with corner pins
 */

/**
 * Props for LrgLrg scaffold template.
 * Default values: size="224x224", wing={usable: 16, nominal: "nominal"}, spacing=32
 */
interface ScaffoldLrgLrgProps extends ScaffoldTemplateProps {}

/**
 * Inner component that receives scaffoldResult as an injected prop from ScaffoldBuilder
 */
interface CustomArrayGridProps {
  scaffoldResult?: ScaffoldResult
  children?: ReactNode
}

function CustomArrayGrid({ scaffoldResult, children }: CustomArrayGridProps) {
  if (!scaffoldResult) {
    return null
  }

  return (
    <>
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
        // skipPattern={scaffoldResult.contactGrid.skipPattern}
        // skipWhen={enhancedSkipWhen}
        // replacePattern={scaffoldResult.contactGrid.replacePattern}
        // replaceWhen={scaffoldResult.contactGrid.replaceWhen}
      >
        {(point) => (
          <chip
            name={`Xpattern${point.index}`}
            pcbX={point.x}
            pcbY={point.y}
            noSchematicRepresentation
          >
            <Scaffold_Slot_Lrg_X_Set />
          </chip>
        )}
      </ArrayGrid>

      {children}
    </>
  )
}

export default function Scaffold_LrgLrg({
  size = "224x224",
  wing = { usable: 16, nominal: "nominal" },
  spacing = 32,
  skipPinOverlap = true,
  debug = false,
  children,
}: ScaffoldLrgLrgProps) {
  return (
    <ScaffoldBuilder
      size={size}
      pinType="MachinePinLargeStandard"
      wing={wing}
      roundEdges={1}
      contactGrid={{
        contactType: "MachineContactLarge",
        spacing: spacing,
        skipPinOverlap: skipPinOverlap,
      }}
      debug={debug}
      schematicDisabled
    >
      <CustomArrayGrid>{children}</CustomArrayGrid>
    </ScaffoldBuilder>
  )
}
