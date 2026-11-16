import { expect, test } from "bun:test"
import { type Box, computeDistanceBetweenBoxes } from "@tscircuit/math-utils"
import type { SchematicComponent } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const toBox = (comp: SchematicComponent): Box => ({
  center: comp.center,
  width: comp.size.width,
  height: comp.size.height,
})

test("schematic auto-layout separates sheet groups nested under separate PCB groups while preserving PCB placement", async () => {
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

  const mainSheet = circuit.db.schematic_sheet.getWhere({ name: "main" })!
  const schR1 = circuit.db.schematic_component.getWhere({
    source_component_id: circuit.db.source_component.getWhere({ name: "R1" })!
      .source_component_id,
  })!
  const schR2 = circuit.db.schematic_component.getWhere({
    source_component_id: circuit.db.source_component.getWhere({ name: "R2" })!
      .source_component_id,
  })!

  expect(schR1.schematic_sheet_id).toBe(mainSheet.schematic_sheet_id)
  expect(schR2.schematic_sheet_id).toBe(mainSheet.schematic_sheet_id)

  const centerDist = Math.hypot(
    schR1.center.x - schR2.center.x,
    schR1.center.y - schR2.center.y,
  )
  expect(centerDist).toBeGreaterThan(0.5)

  const { distance } = computeDistanceBetweenBoxes(toBox(schR1), toBox(schR2))
  expect(distance).toBeGreaterThan(0)

  const leftSourceGroup = circuit.db.source_group.getWhere({ name: "Left" })!
  const rightSourceGroup = circuit.db.source_group.getWhere({ name: "Right" })!
  const leftPcbGroup = circuit.db.pcb_group.getWhere({
    source_group_id: leftSourceGroup.source_group_id,
  })!
  const rightPcbGroup = circuit.db.pcb_group.getWhere({
    source_group_id: rightSourceGroup.source_group_id,
  })!
  const pcbR1 = circuit.db.pcb_component.getWhere({
    source_component_id: schR1.source_component_id,
  })!
  const pcbR2 = circuit.db.pcb_component.getWhere({
    source_component_id: schR2.source_component_id,
  })!

  expect(leftPcbGroup.center.x).toBeCloseTo(-6)
  expect(rightPcbGroup.center.x).toBeCloseTo(6)
  expect(pcbR1.center.x).toBeCloseTo(-6)
  expect(pcbR2.center.x).toBeCloseTo(6)
})

test("schematic auto-layout scopes nested group components to their own sheet when a physical group spans sheets", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={25} height={15} routingDisabled schAutoLayoutEnabled>
      <schematicsheet name="main" sheetIndex={1} />
      <schematicsheet name="aux" sheetIndex={2} />
      <group name="Left" pcbX={-6} schAutoLayoutEnabled>
        <group name="A" schSheetName="main" schAutoLayoutEnabled>
          <resistor
            name="R1"
            resistance="1k"
            footprint="0402"
            schSheetName="main"
          />
        </group>
        <group name="A_AUX" schSheetName="aux" schAutoLayoutEnabled>
          <resistor
            name="R3"
            resistance="1k"
            footprint="0402"
            schSheetName="aux"
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

  const mainSheet = circuit.db.schematic_sheet.getWhere({ name: "main" })!
  const auxSheet = circuit.db.schematic_sheet.getWhere({ name: "aux" })!

  const schR1 = circuit.db.schematic_component.getWhere({
    source_component_id: circuit.db.source_component.getWhere({ name: "R1" })!
      .source_component_id,
  })!
  const schR2 = circuit.db.schematic_component.getWhere({
    source_component_id: circuit.db.source_component.getWhere({ name: "R2" })!
      .source_component_id,
  })!
  const schR3 = circuit.db.schematic_component.getWhere({
    source_component_id: circuit.db.source_component.getWhere({ name: "R3" })!
      .source_component_id,
  })!

  expect(schR1.schematic_sheet_id).toBe(mainSheet.schematic_sheet_id)
  expect(schR2.schematic_sheet_id).toBe(mainSheet.schematic_sheet_id)
  expect(schR3.schematic_sheet_id).toBe(auxSheet.schematic_sheet_id)

  const { distance } = computeDistanceBetweenBoxes(toBox(schR1), toBox(schR2))
  expect(distance).toBeGreaterThan(0)

  // R3 is the sole component on the "aux" sheet, so it remains centered at the origin.
  expect(schR3.center.x).toBeCloseTo(0)
  expect(schR3.center.y).toBeCloseTo(0)
})
