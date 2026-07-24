import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematicsymbol infers its physical component from connections", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm">
      <schematicsheet name="Main Sheet" displayName="Main Sheet" />
      <chip
        name="Q1"
        pinLabels={{
          pin1: "G",
          pin2: "S",
          pin3: "D",
        }}
        noSchematicRepresentation
      />
      <schematicsymbol
        name="A"
        symbolName="n_channel_e_mosfet_transistor"
        connections={{
          gate: ".Q1 > .pin1",
          source: ".Q1 > .pin2",
          drain: ".Q1 > .pin3",
        }}
        schSheetName="Main Sheet"
      />
    </board>,
  )

  circuit.render()

  const q1 = circuit.selectOne("chip.Q1")!
  const schematicComponent = circuit.db.schematic_component.getWhere({
    source_component_id: q1.source_component_id!,
  })!
  const schematicSheet = circuit.db.schematic_sheet.getWhere({
    name: "Main Sheet",
  })!
  const schematicPorts = circuit.db.schematic_port.list({
    schematic_component_id: schematicComponent.schematic_component_id,
  })

  expect(schematicComponent).toBeDefined()
  expect(schematicComponent.schematic_sheet_id).toBe(
    schematicSheet.schematic_sheet_id,
  )
  expect(schematicPorts).toHaveLength(3)
  expect(
    schematicPorts.every(
      (port) => port.schematic_sheet_id === schematicSheet.schematic_sheet_id,
    ),
  ).toBe(true)
})
