import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * REPRO: schematic sheets are laid out independently.
 *
 * Sheet A holds chip `U1` with its series resistor `R1`; Sheet B holds chip
 * `U2` with its series resistor `R2` (assigned via `schSheetName`). The two
 * sheets share no connection, so each sheet is laid out on its own - matchpack
 * only ever receives the components of a single sheet at a time. Each sheet is
 * therefore arranged around its own origin and the two sheets' content centers
 * coincide.
 *
 * The snapshot renders every schematic element together (sheet frames removed)
 * to show that both sheets' clusters are laid out around the same origin and so
 * overlap in the shared coordinate space; viewed per-sheet they each render as
 * an independent, identical chip + resistor cluster.
 */
test("chips on different sheets are laid out independently", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <schematicsheet name="Sheet A" displayName="Sheet A" sheetIndex={0} />
      <schematicsheet name="Sheet B" displayName="Sheet B" sheetIndex={1} />

      {/* Sheet A: a chip with its series resistor */}
      <chip name="U1" footprint="soic16" schSheetName="Sheet A" />
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        schSheetName="Sheet A"
        connections={{ pin1: "U1.pin1" }}
      />

      {/* Sheet B: a chip with its series resistor */}
      <chip name="U2" footprint="soic16" schSheetName="Sheet B" />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        schSheetName="Sheet B"
        connections={{ pin1: "U2.pin1" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  // Snapshot first so it is always captured: render every schematic element
  // together (sheet frames removed) to show the current shared-coordinate
  // layout - both sheets' clusters packed into one space.
  const circuitJson = circuit.getCircuitJson()
  const withoutSheetFrames = circuitJson.filter(
    (elm: AnyCircuitElement) => elm.type !== "schematic_sheet",
  )
  expect(withoutSheetFrames).toMatchSchematicSnapshot(import.meta.path)

  const sheetA = circuit.db.schematic_sheet.getWhere({ name: "Sheet A" })!
  const sheetB = circuit.db.schematic_sheet.getWhere({ name: "Sheet B" })!

  const onSheet = (sheetId: string) =>
    circuit.db.schematic_component
      .list()
      .filter((c) => (c as any).schematic_sheet_id === sheetId)

  // Each chip and its resistor are assigned to their own sheet.
  expect(onSheet(sheetA.schematic_sheet_id).length).toBe(2)
  expect(onSheet(sheetB.schematic_sheet_id).length).toBe(2)

  // Center of each sheet's own content.
  const contentCenter = (sheetId: string) => {
    const comps = onSheet(sheetId)
    const xs = comps.map((c) => c.center.x)
    const ys = comps.map((c) => c.center.y)
    return {
      x: (Math.min(...xs) + Math.max(...xs)) / 2,
      y: (Math.min(...ys) + Math.max(...ys)) / 2,
    }
  }
  const a = contentCenter(sheetA.schematic_sheet_id)
  const b = contentCenter(sheetB.schematic_sheet_id)

  // The two sheets share nothing, so under independent per-sheet layout each
  // is arranged around its own origin and their content centers coincide.
  // Today the board lays both sheets out in one shared space and stacks them,
  // so the centers are far apart.
  expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeLessThan(1)
})
