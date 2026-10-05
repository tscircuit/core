import { expect, test } from "bun:test"
import { any_circuit_element } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip with schematic port arrangement array syntax using string labels", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U1"
        pinLabels={{
          "1": "VCC",
          "2": "GND",
          "3": "IN",
          "4": "OUT",
        }}
        schPinSpacing={0.75}
        schPortArrangement={{
          // Using string labels in the array
          leftSide: ["VCC", "GND"],
          rightSide: ["IN", "OUT"],
        }}
        footprint="soic4"
      />
    </board>,
  )

  circuit.render()

  const schematic_component = circuit.db.schematic_component.list()[0]
  expect(schematic_component).toBeDefined()

  // Verify the port arrangement is correctly processed
  // String labels should be resolved to pin numbers
  expect(schematic_component.port_arrangement).toMatchObject({
    left_side: { pins: [1, 2], direction: "top-to-bottom" },
    right_side: { pins: [3, 4], direction: "top-to-bottom" },
  })
  for (const circuitElement of circuit.getCircuitJson()) {
    any_circuit_element.parse(circuitElement)
  }

  expect(circuit.getCircuitJson()).toMatchSchematicSnapshot(import.meta.path)
})
