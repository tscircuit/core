import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { test, expect } from "bun:test"

test("pushbutton no schematic", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <pushbutton name="PB1" footprint="pushbutton" noSchematicRepresentation />
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()
  const schematicComponents = circuitJson.filter(
    (c) => c.type === "schematic_component",
  )
  expect(schematicComponents.length).toBe(0)
})
