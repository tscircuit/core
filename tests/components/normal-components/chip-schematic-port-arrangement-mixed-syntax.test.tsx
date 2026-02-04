import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip with schematic port arrangement using mixed array and object syntax", async () => {
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
          // Object syntax with explicit direction
          leftSide: {
            pins: [1, 2],
            direction: "bottom-to-top",
          },
          // Array syntax (should get default direction)
          rightSide: [3, 4],
        }}
        footprint="soic4"
      />
    </board>,
  )

  circuit.render()

  const schematic_component = circuit.db.schematic_component.list()[0]
  expect(schematic_component).toBeDefined()

  // Verify the port arrangement is correctly processed
  const portArrangement = schematic_component.port_arrangement as {
    left_side?: { pins: number[]; direction?: string }
    right_side?: { pins: number[]; direction?: string }
  }
  expect(portArrangement).toBeDefined()
  expect(portArrangement?.left_side?.pins).toEqual([1, 2])
  expect(portArrangement?.right_side?.pins).toEqual([3, 4])

  // Left side uses explicit bottom-to-top direction
  expect(portArrangement?.left_side?.direction).toBe("bottom-to-top")
  // Right side uses default top-to-bottom direction
  expect(portArrangement?.right_side?.direction).toBe("top-to-bottom")

  expect(circuit.getCircuitJson()).toMatchSchematicSnapshot(import.meta.path)
})
