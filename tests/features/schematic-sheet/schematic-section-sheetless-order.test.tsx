import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("sheetless named sections are packed before unsectioned components", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board routingDisabled>
      <schematicsection name="A" displayName="Section A" />
      <schematicsection name="B" displayName="Section B" />
      <resistor name="R_FREE" resistance="1k" footprint="0402" />
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
  expect(position("R_FREE").y).toBeLessThan(position("R_A").y)
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
