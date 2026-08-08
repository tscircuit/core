import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { any_circuit_element, schematic_component } from "circuit-json"

test("pinheader schematic_component port_arrangement uses numeric pins and passes the circuit-json parser", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <pinheader name="J1" pinCount={2} footprint="pinrow2" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const schematicComponent = (circuit.getCircuitJson() as any[]).find(
    (el) => el.type === "schematic_component",
  )
  expect(schematicComponent).toBeDefined()

  // Regression guard: the schema requires pins to be pin numbers (number[]).
  // Before the fix these were "pin1"/"pin2" label strings, so both parses below
  // failed and the whole board's circuit-json was rejected by any_circuit_element.
  expect(schematicComponent.port_arrangement.right_side.pins).toEqual([1, 2])
  expect(schematic_component.safeParse(schematicComponent).success).toBe(true)
  expect(any_circuit_element.safeParse(schematicComponent).success).toBe(true)
})
