import { ScaffoldBuilder } from "../../src/ScaffoldBuilder"
import type { ScaffoldResult } from "../../src/ScaffoldCalculator"
import type { ScaffoldTemplateProps } from "../../ScaffoldTemplate"
import { parseSize } from "@tsci/imrishabh18.molecule"
import type { ReactNode } from "react"

import { ArrayGrid } from "../../util/array-grid"
import {
  Scaffold_Slot_Lrg_Single,
  Scaffold_Slot_Lrg_X_Set,
  Scaffold_Slot_Med_X_Combined_Set,
} from "../../src/ScaffoldSlots"

/**
 * Reusable Large/Medium Scaffold Component
 *
 * A simplified scaffold for Large machine pins with Medium contacts.
 * Provides sensible defaults while allowing customization.
 *
 * Default configuration:
 * - Size: 64x64mm
 * - Pin Type: MachinePinLargeStandard
 * - Contact Type: MachineContactMedium
 * - Spacing: 8mm grid
 * - Wing: 16mm usable + nominal tolerance
 * - Auto-skips contacts overlapping with corner pins
 */

/**
 * Props for LrgMed scaffold template.
 * Default values: size="64x64", wing={usable: 16, nominal: "nominal"}, spacing=8
 */
interface ScaffoldLrgMedProps extends ScaffoldTemplateProps {}

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

  const cornerSlotShiftX =
    (parseSize(scaffoldResult.moleculeProps.size).width + 16) / 2
  const cornerSlotShiftY =
    (parseSize(scaffoldResult.moleculeProps.size).height + 16) / 2
  // console.log("cornerSlotShiftX: ", cornerSlotShiftX);
  // console.log("cornerSlotShiftY: ", cornerSlotShiftY);

  return (
    <>
      <ArrayGrid
        cols={scaffoldResult.contactGrid.cols - 1}
        rows={scaffoldResult.contactGrid.rows - 1}
        spacingX={scaffoldResult.contactGrid.spacingX}
        spacingY={scaffoldResult.contactGrid.spacingY}
        anchor="center"
        startX={0}
        startY={0}
        // startX={scaffoldResult.contentsShiftX + (scaffoldResult.contactGrid.shiftX ?? 0)}
        // startY={scaffoldResult.contentsShiftY + (scaffoldResult.contactGrid.shiftY ?? 0)}
        startIndex={1}
        // skipPattern={scaffoldResult.contactGrid.skipPattern}
        skipPattern="corners"
        // skipWhen={enhancedSkipWhen}
        // replacePattern={scaffoldResult.contactGrid.replacePattern}
        // replaceWhen={scaffoldResult.contactGrid.replaceWhen}
        skipWhen={
          (point) =>
            (point.row === 1 && point.col === 1) || // top-left intersection
            (point.row === 1 && point.col === point.totalCols - 2) || // top-right intersection
            (point.row === point.totalRows - 2 && point.col === 1) || // bottom-left intersection
            (point.row === point.totalRows - 2 &&
              point.col === point.totalCols - 2) // bottom-right intersection
        }
      >
        {(point) => (
          <chip
            name={`Xpattern${point.index}`}
            pcbX={point.x}
            pcbY={point.y}
            key={`Xpattern${point.index}`}
            noSchematicRepresentation
          >
            <Scaffold_Slot_Med_X_Combined_Set />
          </chip>
        )}
      </ArrayGrid>

      {["BL", "TL", "TR", "BR"].map((cornerPositionName, index) => {
        const x = cornerPositionName.includes("R")
          ? -cornerSlotShiftX
          : cornerSlotShiftX
        const y = cornerPositionName.includes("T")
          ? -cornerSlotShiftY
          : cornerSlotShiftY
        const rotation = index * 90 + 45
        return (
          // <chip name={`CornerSlot${cornerPositionName}`} pcbX={x} pcbY={y} pcbRotation={rotation} noSchematicRepresentation>
          <Scaffold_Slot_Lrg_Single
            pcbX={x}
            pcbY={y}
            pcbRotation={rotation}
            key={`Slot${cornerPositionName}`}
          />
          // </chip>
        )
      })}

      {children}
    </>
  )
}

export default function Scaffold_LrgMed({
  size = "64x64",
  wing = { usable: 16, nominal: "nominal" },
  spacing = 8,
  skipPinOverlap = true,
  debug = false,
  children,
}: ScaffoldLrgMedProps) {
  return (
    <ScaffoldBuilder
      size={size}
      pinType="MachinePinLargeStandard"
      wing={wing}
      roundEdges={1}
      contactGrid={{
        contactType: "MachineContactMedium",
        spacing: spacing,
        skipPinOverlap: skipPinOverlap,
      }}
      debug={debug}
    >
      <CustomArrayGrid>{children}</CustomArrayGrid>
    </ScaffoldBuilder>
  )
}
