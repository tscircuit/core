import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/*
 * Bug: Negative and zero physical dimensions are accepted with no error
 *
 * What should happen:
 *   Negative diameters (hole, via, plated hole) should produce a
 *   pcb_placement_error — they are unmanufacturable.
 *
 * What actually happens:
 *   Negative values flow silently into circuit JSON. A hole with
 *   hole_diameter=-2mm produces no error.
 *
 * Root cause:
 *   Board_doInitialPcbPlacementDesignRuleChecks.ts runs placement DRC
 *   checks (overlap, clearance, out-of-board) but does NOT validate
 *   dimension values for basic sanity (negative, zero, NaN).
 *
 * Visual (PCB snapshot):
 *   Board renders. Plated hole and via show outer copper rings (positive
 *   r) but their drill holes emit negative r in the SVG (r=-12.5,
 *   r=-7.5) making them invisible per SVG spec. The plain hole emits
 *   r=-50 and is also invisible.
 */
test.failing(
  "negative and zero dimensions should produce a placement error",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board width="10mm" height="10mm">
        <hole name="H1" diameter="-2mm" pcbX={0} pcbY={0} />
        <via
          name="V1"
          holeDiameter="-0.3mm"
          outerDiameter="0.6mm"
          pcbX={2}
          pcbY={2}
        />
        <platedhole
          name="PH1"
          shape="circle"
          holeDiameter="-0.5mm"
          outerDiameter="0.9mm"
          pcbX={-2}
          pcbY={-2}
        />
      </board>,
    )

    await circuit.renderUntilSettled()

    // PCB snapshot: board + outer copper rings visible, drill holes
    // invisible because hole_diameter is negative in SVG
    expect(circuit).toMatchPcbSnapshot(import.meta.path)

    // Check that negative values are in the DB
    for (const hole of circuit.db.pcb_hole.list() as any[]) {
      console.log(`hole hole_diameter=${hole.hole_diameter} (should be > 0)`)
    }
    for (const via of circuit.db.pcb_via.list() as any[]) {
      console.log(`via hole_diameter=${via.hole_diameter} (should be > 0)`)
    }
    for (const ph of circuit.db.pcb_plated_hole.list() as any[]) {
      console.log(
        `plated_hole hole_diameter=${ph.hole_diameter} (should be > 0)`,
      )
    }

    // At least one placement error should exist about dimensions
    const placementErrors = circuit.db.pcb_placement_error.list()
    console.log(`placement errors: ${placementErrors.length}`)
    expect(placementErrors.length).toBeGreaterThan(0)
  },
)
