import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * Schematic sheets are laid out independently.
 *
 * `U1` is on "Sheet A" and `U2` is on "Sheet B" (via `schSheetName`). matchpack
 * only ever lays out the components of a single sheet at a time, so each chip -
 * the only component on its own sheet - is centered near its sheet's origin
 * instead of being packed side-by-side with the other sheet's chip. The two
 * sheet centers therefore coincide.
 *
 * (Before per-sheet layout, matchpack received both sheets' components together
 * and packed them into one shared coordinate space, dragging Sheet B's center
 * off origin.)
 */
test("chips on different sheets are laid out independently", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <schematicsheet name="Sheet A" displayName="Sheet A" sheetIndex={0} />
      <schematicsheet name="Sheet B" displayName="Sheet B" sheetIndex={1} />

      <chip name="U1" footprint="soic16" schSheetName="Sheet A" />
      <chip name="U2" footprint="soic16" schSheetName="Sheet B" />

      {/* Cross-sheet connections must NOT pull the two chips together. */}
      <trace from=".U1 > .pin1" to=".U2 > .pin1" />
      <trace from=".U1 > .pin8" to=".U2 > .pin8" />
      <trace from=".U1 > .pin16" to=".U2 > .pin16" />
    </board>,
  )

  await circuit.renderUntilSettled()

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

  // Each chip is assigned to its own sheet.
  expect(u1.schematic_sheet_id).toBe(sheetA.schematic_sheet_id)
  expect(u2.schematic_sheet_id).toBe(sheetB.schematic_sheet_id)
  expect(u1.schematic_sheet_id).not.toBe(u2.schematic_sheet_id)

  // Each chip is the only component on its sheet, so with independent layout
  // both are centered near their own sheet origin (≈ same coordinates) rather
  // than packed side-by-side in a shared coordinate space.
  expect(Math.abs(u2.center.x - u1.center.x)).toBeLessThan(1)

  // Independent layout means each sheet centers on its own content, so the two
  // sheet centers coincide.
  expect((sheetB as any).center.x).toBeCloseTo((sheetA as any).center.x, 1)

  // Render both sheets stacked: each chip is independently centered in its own
  // sheet frame (rather than packed together in one shared coordinate space).
  await expect(circuit).toMatchStackedSchematicSnapshot(import.meta.path)
})
