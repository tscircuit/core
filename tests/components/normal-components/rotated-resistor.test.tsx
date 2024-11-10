import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rotated resistor schematic", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="10k" schRotation="90deg" />
    </board>,
  )

  circuit.render()

  expect(circuit.db.schematic_component.list()[0].symbol_name).toEqual(
    "boxresistor_vert",
  )

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
