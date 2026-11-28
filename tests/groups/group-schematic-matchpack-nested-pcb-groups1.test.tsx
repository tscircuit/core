import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematic auto-layout separates groups nested under separate PCB groups", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={25} height={15} routingDisabled schAutoLayoutEnabled>
      <schematicsheet name="main" sheetIndex={1} />
      <group name="Left" pcbX={-6} schAutoLayoutEnabled>
        <group name="A" schSheetName="main" schAutoLayoutEnabled>
          <resistor
            name="R1"
            resistance="1k"
            footprint="0402"
            schSheetName="main"
          />
        </group>
      </group>
      <group name="Right" pcbX={6} schAutoLayoutEnabled>
        <group name="B" schSheetName="main" schAutoLayoutEnabled>
          <resistor
            name="R2"
            resistance="1k"
            footprint="0402"
            schSheetName="main"
          />
        </group>
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  const r1Source = circuit.db.source_component.getWhere({ name: "R1" })!
  const r2Source = circuit.db.source_component.getWhere({ name: "R2" })!
  const r1Sch = circuit.db.schematic_component.getWhere({
    source_component_id: r1Source.source_component_id,
  })!
  const r2Sch = circuit.db.schematic_component.getWhere({
    source_component_id: r2Source.source_component_id,
  })!
  const r1Pcb = circuit.db.pcb_component.getWhere({
    source_component_id: r1Source.source_component_id,
  })!
  const r2Pcb = circuit.db.pcb_component.getWhere({
    source_component_id: r2Source.source_component_id,
  })!
  const groupA = circuit.db.source_group.getWhere({ name: "A" })!
  const groupB = circuit.db.source_group.getWhere({ name: "B" })!
  const schGroupA = circuit.db.schematic_group.getWhere({
    source_group_id: groupA.source_group_id,
  })!
  const schGroupB = circuit.db.schematic_group.getWhere({
    source_group_id: groupB.source_group_id,
  })!

  expect(
    Math.hypot(
      r1Sch.center.x - r2Sch.center.x,
      r1Sch.center.y - r2Sch.center.y,
    ),
  ).toBeGreaterThan(1)
  expect(schGroupA.center).toEqual(r1Sch.center)
  expect(schGroupB.center).toEqual(r2Sch.center)
  expect(r1Pcb.center.x).toBeCloseTo(-6, 3)
  expect(r2Pcb.center.x).toBeCloseTo(6, 3)

  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
