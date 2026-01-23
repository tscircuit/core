import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getPhaseTimingsFromRenderEvents } from "lib/utils/render-events/getPhaseTimingsFromRenderEvents"
import Scaffold_LrgMed from "imrishabh18-scaffold/lib/scaffolds/LrgMed/ScaffoldLrgMedTemplate"

export interface CrossWithCornerHolesComponentProps {
  /** Center X position */
  pcbX?: string | number
  /** Center Y position */
  pcbY?: string | number
  /** Rotation of entire component */
  pcbRotation?: string | number
  /** Outer width of the pill-shaped holes forming the cross */
  crossOuterWidth?: string | number
  /** Outer height of the pill-shaped holes forming the cross */
  crossOuterHeight?: string | number
  /** Hole width of the pill-shaped holes */
  crossHoleWidth?: string | number
  /** Hole height of the pill-shaped holes */
  crossHoleHeight?: string | number
  /** Hole diameter of the corner circular holes */
  cornerHoleDiameter?: string | number
  /** Outer diameter of the corner circular holes */
  cornerOuterDiameter?: string | number
  /** Distance from center to corner holes */
  cornerDistance?: string | number
}

function CrossWithCornerHolesComponent({
  pcbX = 0,
  pcbY = 0,
  pcbRotation = 0,
  crossOuterWidth = "6mm",
  crossOuterHeight = "1.5mm",
  crossHoleWidth = "5mm",
  crossHoleHeight = "1mm",
  cornerHoleDiameter = "1.5mm",
  cornerOuterDiameter = "2mm",
  cornerDistance = 4,
}: CrossWithCornerHolesComponentProps) {
  return (
    <group pcbX={pcbX} pcbY={pcbY} pcbRotation={pcbRotation}>
      <footprint>
        {/* Cross pattern - two pill-shaped holes */}
        <platedhole
          shape="pill"
          outerWidth={crossOuterWidth}
          outerHeight={crossOuterHeight}
          holeWidth={crossHoleWidth}
          holeHeight={crossHoleHeight}
          pcbX={0}
          pcbY={0}
          pcbRotation="45deg"
        />
        <platedhole
          shape="pill"
          outerWidth={crossOuterWidth}
          outerHeight={crossOuterHeight}
          holeWidth={crossHoleWidth}
          holeHeight={crossHoleHeight}
          pcbX={0}
          pcbY={0}
          pcbRotation="-45deg"
        />

        {/* Four corner circular holes */}
        <platedhole
          shape="circle"
          holeDiameter={cornerHoleDiameter}
          outerDiameter={cornerOuterDiameter}
          pcbX={cornerDistance}
          pcbY={cornerDistance}
        />
        <platedhole
          shape="circle"
          holeDiameter={cornerHoleDiameter}
          outerDiameter={cornerOuterDiameter}
          pcbX={-cornerDistance}
          pcbY={cornerDistance}
        />
        <platedhole
          shape="circle"
          holeDiameter={cornerHoleDiameter}
          outerDiameter={cornerOuterDiameter}
          pcbX={-cornerDistance}
          pcbY={-cornerDistance}
        />
        <platedhole
          shape="circle"
          holeDiameter={cornerHoleDiameter}
          outerDiameter={cornerOuterDiameter}
          pcbX={cornerDistance}
          pcbY={-cornerDistance}
        />
      </footprint>
    </group>
  )
}

test(
  "scaffold with machine pins - with phase timing",
  async () => {
    const { circuit } = getTestFixture()

    // const rows = 50
    // const cols = 50
    // const spacing = 10 // spacing between components in mm

    // // Calculate board size based on matrix
    // const boardWidth = cols * spacing + spacing
    // const boardHeight = rows * spacing + spacing

    // // Calculate starting position to center the matrix
    // const startX = -((cols - 1) * spacing) / 2
    // const startY = -((rows - 1) * spacing) / 2

    circuit.add(<Scaffold_LrgMed size="128x192" />)

    // Collect render events
    const renderEvents: any[] = []
    circuit.on("renderable:renderLifecycle:anyEvent", (ev) => {
      ev.createdAt = performance.now()
      renderEvents.push(ev)
    })

    await circuit.renderUntilSettled()

    // Get phase timings
    const phaseTimings = getPhaseTimingsFromRenderEvents(renderEvents)

    // Log the results sorted by time
    const sortedPhases = Object.entries(phaseTimings)
      .sort(([, a], [, b]) => b - a)
      .map(([phase, time]) => `${phase}: ${time.toFixed(2)}ms`)

    console.log("Phase timings (slowest first):")
    sortedPhases.forEach((entry) => console.log(`  ${entry}`))

    // expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
  },
  { timeout: 30000 },
)
