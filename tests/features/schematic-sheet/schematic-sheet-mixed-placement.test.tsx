import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("sheet sections preserve fixed parts while other parts can be packed", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board routingDisabled>
      <schematicsheet name="Input">
        <schematicsection name="filter" displayName="Input filter" />
        <resistor name="R1" resistance="1k" schSectionName="filter" schX={-8} />
        <capacitor
          name="C1"
          capacitance="1uF"
          schSectionName="filter"
          connections={{ pin1: "R1.pin2" }}
        />
      </schematicsheet>
      <schematicsheet name="Output">
        <resistor name="R2" resistance="2k" />
        <capacitor
          name="C2"
          capacitance="2uF"
          connections={{ pin1: "R2.pin2" }}
        />
      </schematicsheet>
    </board>,
  )
  await circuit.renderUntilSettled()

  const center = (name: string) => {
    const source = circuit.db.source_component.getWhere({ name })!
    return circuit.db.schematic_component.getWhere({
      source_component_id: source.source_component_id,
    })!.center
  }
  expect(center("R1")).toEqual({ x: -8, y: 0 })
  expect(center("C1")).not.toEqual({ x: 0, y: 0 })
  expect(center("R2")).not.toEqual(center("C2"))
  await expect(circuit).toMatchStackedSchematicSnapshot(import.meta.path)
})
