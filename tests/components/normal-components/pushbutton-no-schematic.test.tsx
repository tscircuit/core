import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { test, expect } from "bun:test"

test("pushbutton no schematic", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <pushbutton name="PB1" noSchematicRepresentation={true} />
    </board>,
  )

  circuit.render()

  const schematicComponents = circuit.selectAll("schematic_component")
  expect(schematicComponents.length).toBe(0)
})
