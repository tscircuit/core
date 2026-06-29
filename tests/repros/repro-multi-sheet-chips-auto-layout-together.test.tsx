import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * REPRO (test.failing): schematic sheets should be laid out independently.
 *
 * `U1` is on "Sheet A" and `U2` is on "Sheet B" (via `schSheetName`). Each chip
 * is the only component on its sheet, so when sheets are laid out independently
 * each chip should be centered near its own sheet's origin and the two sheet
 * centers should coincide.
 *
 * Today matchpack receives the components of BOTH sheets together and packs
 * them side-by-side into one shared coordinate space (U1 near the origin, U2
 * pushed off to the side), which also drags Sheet B's center along with it - so
 * the assertions below currently fail. The snapshot (taken first) documents
 * that current, buggy shared-coordinate-space layout. When per-sheet layout is
 * implemented this test should pass; regenerate the snapshot and flip it back
 * to `test` at that point.
 */
test.failing(
  "chips on different sheets are laid out independently",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board routingDisabled>
        <schematicsheet name="Sheet A" displayName="Sheet A" sheetIndex={0} />
        <schematicsheet name="Sheet B" displayName="Sheet B" sheetIndex={1} />

        <chip name="U1" footprint="soic16" schSheetName="Sheet A" />
        <chip name="U2" footprint="soic16" schSheetName="Sheet B" />

        {/* Cross-sheet connections give matchpack a reason to pull the two
            chips toward each other. */}
        <trace from=".U1 > .pin1" to=".U2 > .pin1" />
        <trace from=".U1 > .pin8" to=".U2 > .pin8" />
        <trace from=".U1 > .pin16" to=".U2 > .pin16" />
      </board>,
    )

    await circuit.renderUntilSettled()

    // Snapshot first so it is always captured: render every schematic element
    // together (sheet frames removed) to show the current shared-coordinate
    // layout - two chips that are supposed to live on separate sheets packed
    // and wired as if on one sheet.
    const circuitJson = circuit.getCircuitJson()
    const withoutSheetFrames = circuitJson.filter(
      (elm: AnyCircuitElement) => elm.type !== "schematic_sheet",
    )
    expect(withoutSheetFrames).toMatchSchematicSnapshot(import.meta.path)

    const getSchComp = (name: string) => {
      const sourceComponent = circuit.db.source_component.getWhere({ name })
      return circuit.db.schematic_component.getWhere({
        source_component_id: sourceComponent?.source_component_id,
      })!
    }

    const sheetA = circuit.db.schematic_sheet.getWhere({ name: "Sheet A" })!
    const sheetB = circuit.db.schematic_sheet.getWhere({ name: "Sheet B" })!
    const u1 = getSchComp("U1")
    const u2 = getSchComp("U2")

    // Each chip is correctly assigned to its own sheet.
    expect(u1.schematic_sheet_id).toBe(sheetA.schematic_sheet_id)
    expect(u2.schematic_sheet_id).toBe(sheetB.schematic_sheet_id)
    expect(u1.schematic_sheet_id).not.toBe(u2.schematic_sheet_id)

    // Each chip is the only component on its sheet, so with independent layout
    // both should be centered near their own sheet origin (≈ same coordinates),
    // not packed side-by-side in a shared coordinate space.
    expect(Math.abs(u2.center.x - u1.center.x)).toBeLessThan(1)

    // Independent layout means each sheet centers on its own content, so the
    // two sheet centers coincide.
    expect((sheetB as any).center.x).toBeCloseTo((sheetA as any).center.x, 1)
  },
)
