import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("multi-sheet schematic auto-layout scopes nested PCB groups to each sheet", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={25} height={15} routingDisabled schAutoLayoutEnabled>
      <schematicsheet name="power" sheetIndex={1} />
      <schematicsheet name="io" sheetIndex={2} />
      <group name="Left" pcbX={-6} schAutoLayoutEnabled>
        <group name="A" schSheetName="power" schAutoLayoutEnabled>
          <resistor
            name="R1"
            resistance="1k"
            footprint="0402"
            schSheetName="power"
          />
          <capacitor
            name="C1"
            capacitance="100nF"
            footprint="0402"
            schSheetName="power"
          />
          <trace from=".R1 > .pin2" to=".C1 > .pin1" />
        </group>
        <group name="C" schSheetName="io" schAutoLayoutEnabled>
          <resistor
            name="R3"
            resistance="10k"
            footprint="0402"
            schSheetName="io"
          />
        </group>
      </group>
      <group name="Right" pcbX={6} schAutoLayoutEnabled>
        <group name="B" schSheetName="power" schAutoLayoutEnabled>
          <resistor
            name="R2"
            resistance="2.2k"
            footprint="0402"
            schSheetName="power"
          />
        </group>
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  const getSchComp = (name: string) => {
    const source = circuit.db.source_component.getWhere({ name })!
    return circuit.db.schematic_component.getWhere({
      source_component_id: source.source_component_id,
    })!
  }

  const r1 = getSchComp("R1")
  const c1 = getSchComp("C1")
  const r2 = getSchComp("R2")
  const r3 = getSchComp("R3")
  const powerSheet = circuit.db.schematic_sheet.getWhere({ name: "power" })!
  const ioSheet = circuit.db.schematic_sheet.getWhere({ name: "io" })!

  expect(r1.schematic_sheet_id).toBe(powerSheet.schematic_sheet_id)
  expect(c1.schematic_sheet_id).toBe(powerSheet.schematic_sheet_id)
  expect(r2.schematic_sheet_id).toBe(powerSheet.schematic_sheet_id)
  expect(r3.schematic_sheet_id).toBe(ioSheet.schematic_sheet_id)

  // R1 and C1 remain separated inside A, and B (R2) does not overlap either of them.
  expect(
    Math.hypot(r1.center.x - c1.center.x, r1.center.y - c1.center.y),
  ).toBeGreaterThan(1)
  expect(
    Math.hypot(r2.center.x - r1.center.x, r2.center.y - r1.center.y),
  ).toBeGreaterThan(1)
  expect(
    Math.hypot(r2.center.x - c1.center.x, r2.center.y - c1.center.y),
  ).toBeGreaterThan(1)
  // R3 is the sole component on the "io" sheet and stays unaffected by "power" sheet layout.
  expect(r3.center).toEqual({ x: 0, y: 0 })

  await expect(circuit).toMatchStackedSchematicSnapshot(import.meta.path)
})
