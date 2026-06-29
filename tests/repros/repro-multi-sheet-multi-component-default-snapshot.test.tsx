import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * Same setup as repro-multi-sheet-multi-component-per-sheet, but rendered with
 * the regular (single-sheet) schematic snapshot instead of the stacked one.
 *
 * `convertCircuitJsonToSchematicSvg` renders one sheet at a time and defaults to
 * the lowest sheet_index, so this snapshot shows ONLY Sheet A (U1 + RA1 + CA1).
 * Sheet B's components are filtered out. The components are still laid out
 * independently per sheet (asserted below).
 */
test("multi-sheet circuit renders only the default sheet in a normal snapshot", async () => {
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

  const u1 = comp("U1")
  const u2 = comp("U2")

  // Each sheet is laid out independently around the origin: the chips (which
  // have no extra connections) land at the same place on both sheets.
  expect(u2.center.x).toBeCloseTo(u1.center.x, 1)
  expect(u2.center.y).toBeCloseTo(u1.center.y, 1)

  // Traces are assigned to the sheet of the components they connect, so the
  // wires render on the sheet (they were invisible when traces had no sheet).
  const sheetA = circuit.db.schematic_sheet.getWhere({ name: "Sheet A" })!
  const sheetB = circuit.db.schematic_sheet.getWhere({ name: "Sheet B" })!
  const traceSheetIds = circuit.db.schematic_trace
    .list()
    .map((t) => (t as any).schematic_sheet_id)
  expect(
    traceSheetIds.filter((id) => id === sheetA.schematic_sheet_id).length,
  ).toBeGreaterThan(0)
  expect(
    traceSheetIds.filter((id) => id === sheetB.schematic_sheet_id).length,
  ).toBeGreaterThan(0)

  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
