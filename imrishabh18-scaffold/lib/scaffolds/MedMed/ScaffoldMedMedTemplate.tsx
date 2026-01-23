import { ScaffoldBuilder } from "../../src/ScaffoldBuilder"
import type { ScaffoldResult } from "../../src/ScaffoldCalculator"
import type { ScaffoldTemplateProps } from "../../ScaffoldTemplate"
import type { ReactNode } from "react"

/**
 * Reusable Medium/Medium Scaffold Component
 *
 * A simplified scaffold for Medium machine pins with Medium contacts.
 * Provides sensible defaults while allowing customization.
 *
 * Default configuration:
 * - Size: 32x32mm
 * - Pin Type: MachinePinMediumStandard
 * - Contact Type: MachineContactMedium
 * - Spacing: 4mm grid
 * - Wing: 0.5mm
 * - Auto-skips contacts overlapping with corner pins
 */

/**
 * Props for MedMed scaffold template.
 * Default values: size="32x32", wing="0.5mm", spacing=4
 */
interface ScaffoldMedMedProps extends ScaffoldTemplateProps {}

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

  return <>{children}</>
}

export default function Scaffold_MedMed({
  size = "32x32",
  wing = "0.5mm",
  spacing = 4,
  skipPinOverlap = true,
  debug = false,
  children,
}: ScaffoldMedMedProps) {
  return (
    <ScaffoldBuilder
      size={size}
      pinType="MachinePinMediumStandard"
      wing={wing}
      roundEdges={1}
      contactGrid={{
        cols: "d-1",
        rows: "d-1",
        contactType: "MachineContactMedium",
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
