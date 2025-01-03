import { expect, it, describe } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("should not render chip in schematic when noSchematicRepresentation is true", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        manufacturerPartNumber="ATmega8-16A"
        noSchematicRepresentation={true}
      />
    </board>,
  )
  circuit.render()

  // Verify that the chip exists but isn't in schematic
  const chip = circuit.selectOne("chip[name='U1']")
  expect(chip).not.toBeNull()
  expect(chip!.props.noSchematicRepresentation).toBe(true)

  const schematic_component = circuit.db.schematic_component.list()
  const isChipInSchematic = schematic_component.some(
    (sc) => sc.source_component_id === chip!.source_component_id,
  )
  expect(isChipInSchematic).toBe(false)
})

it("should render chip in schematic when noSchematicRepresentation is false or undefined", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <chip name="U2" manufacturerPartNumber="ATmega8-16A" />
    </board>,
  )
  circuit.render()

  // Verify that the chip exists and is in schematic
  const chip = circuit.selectOne("chip[name='U2']")
  expect(chip).not.toBeNull()
  expect(chip!.props.noSchematicRepresentation).toBeUndefined()

  const schematic_component = circuit.db.schematic_component.list()
  const isChipInSchematic = schematic_component.some(
    (sc) => sc.source_component_id === chip!.source_component_id,
  )
  expect(isChipInSchematic).toBe(true)
})
