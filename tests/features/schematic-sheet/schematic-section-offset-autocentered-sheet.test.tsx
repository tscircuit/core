import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("automatically centered sheets do not shrink row width for an offset group", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board routingDisabled>
      <schematicsheet name="main">
        <schematicsection name="A" displayName="Section A" />
        <schematicsection name="B" displayName="Section B" />
      </schematicsheet>
      <group name="offset" schX={14} schSheetName="main">
        <resistor
          name="R_A"
          resistance="1k"
          footprint="0402"
          schSectionName="A"
        />
        <resistor
          name="R_B"
          resistance="1k"
          footprint="0402"
          schSectionName="B"
        />
      </group>
    </board>,
  )
  await circuit.renderUntilSettled()
  const position = (name: string) => {
    const source = circuit.db.source_component
      .list()
      .find((component) => component.name === name)!
    return circuit.db.schematic_component.getWhere({
      source_component_id: source.source_component_id,
    })!.center
  }
  expect(position("R_A").y).toBe(position("R_B").y)
  expect(
    circuit.db.schematic_element_outside_sheet_warning.list(),
  ).toHaveLength(0)
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
