import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * Schematic sheets with multiple components each are laid out independently.
 *
 * Sheet A holds U1 + RA1 + CA1, Sheet B holds U2 + RB1 + CB1 (each cluster is
 * wired within its own sheet). matchpack runs once per sheet, so:
 *  - within a sheet the components are packed into a cluster (not stacked at the
 *    origin), and
 *  - the two sheets are laid out independently around the same origin - Sheet B
 *    does not get pushed into a separate region by Sheet A. Because both sheets
 *    have the same contents, their layouts come out identical and overlap, and
 *    the two sheet centers coincide.
 *
 * (If both sheets were laid out together, all six components would be packed
 * into one shared coordinate space and the two clusters would not coincide.)
 */
test("multiple components on different sheets are laid out independently", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <schematicsheet name="Sheet A" displayName="Sheet A" sheetIndex={0} />
      <schematicsheet name="Sheet B" displayName="Sheet B" sheetIndex={1} />

      {/* Sheet A cluster */}
      <chip name="U1" footprint="soic8" schSheetName="Sheet A" />
      <resistor
        name="RA1"
        resistance="1k"
        footprint="0402"
        schSheetName="Sheet A"
      />
      <capacitor
        name="CA1"
        capacitance="100nF"
        footprint="0402"
        schSheetName="Sheet A"
      />

      {/* Sheet B cluster */}
      <chip name="U2" footprint="soic8" schSheetName="Sheet B" />
      <resistor
        name="RB1"
        resistance="1k"
        footprint="0402"
        schSheetName="Sheet B"
      />
      <capacitor
        name="CB1"
        capacitance="100nF"
        footprint="0402"
        schSheetName="Sheet B"
      />

      {/* Each cluster is wired only within its own sheet. */}
      <trace from=".U1 > .pin1" to=".RA1 > .pin1" />
      <trace from=".U1 > .pin2" to=".CA1 > .pin1" />
      <trace from=".U2 > .pin1" to=".RB1 > .pin1" />
      <trace from=".U2 > .pin2" to=".CB1 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const comp = (name: string) => {
    const sourceComponent = circuit.db.source_component.getWhere({ name })
    return circuit.db.schematic_component.getWhere({
      source_component_id: sourceComponent?.source_component_id,
    })!
  }

  const sheetA = circuit.db.schematic_sheet.getWhere({ name: "Sheet A" })!
  const sheetB = circuit.db.schematic_sheet.getWhere({ name: "Sheet B" })!
  const u1 = comp("U1")
  const ra1 = comp("RA1")
  const ca1 = comp("CA1")
  const u2 = comp("U2")
  const rb1 = comp("RB1")
  const cb1 = comp("CB1")

  // Components are assigned to the correct sheets.
  for (const c of [u1, ra1, ca1]) {
    expect(c.schematic_sheet_id).toBe(sheetA.schematic_sheet_id)
  }
  for (const c of [u2, rb1, cb1]) {
    expect(c.schematic_sheet_id).toBe(sheetB.schematic_sheet_id)
  }
  expect(sheetA.schematic_sheet_id).not.toBe(sheetB.schematic_sheet_id)

  // matchpack laid out each sheet's components as a spread-out cluster rather
  // than leaving them stacked at the origin.
  expect(Math.abs(ra1.center.y - u1.center.y)).toBeGreaterThan(1)
  expect(Math.abs(ca1.center.x - u1.center.x)).toBeGreaterThan(1)

  // Independent per-sheet layout: each Sheet B component coincides with its
  // Sheet A counterpart (the sheets are laid out identically around the same
  // origin), not packed into a separate region of one shared layout.
  expect(u2.center.x).toBeCloseTo(u1.center.x, 1)
  expect(u2.center.y).toBeCloseTo(u1.center.y, 1)
  expect(rb1.center.x).toBeCloseTo(ra1.center.x, 1)
  expect(rb1.center.y).toBeCloseTo(ra1.center.y, 1)
  expect(cb1.center.x).toBeCloseTo(ca1.center.x, 1)
  expect(cb1.center.y).toBeCloseTo(ca1.center.y, 1)

  // The two sheet centers coincide.
  expect((sheetB as any).center.x).toBeCloseTo((sheetA as any).center.x, 1)
  expect((sheetB as any).center.y).toBeCloseTo((sheetA as any).center.y, 1)

  // Both sheets stacked: each shows its own component cluster centered in its
  // frame.
  await expect(circuit).toMatchStackedSchematicSnapshot(import.meta.path)
})
