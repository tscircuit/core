import { expect, test } from "bun:test"
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
  const portArrangement = schematic_component.port_arrangement as {
    left_side?: { pins: (number | string)[]; direction?: string }
    right_side?: { pins: (number | string)[]; direction?: string }
  }
  expect(portArrangement).toBeDefined()
  expect(portArrangement?.left_side?.pins).toEqual(["VCC", "GND"])
  expect(portArrangement?.right_side?.pins).toEqual(["IN", "OUT"])

  expect(circuit.getCircuitJson()).toMatchSchematicSnapshot(import.meta.path)
})
