import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip with schematic port arrangement array syntax on all sides", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U1"
        pinLabels={{
          "1": "VCC",
          "2": "GND",
          "3": "IN1",
          "4": "IN2",
          "5": "OUT1",
          "6": "OUT2",
          "7": "CLK",
          "8": "RST",
        }}
        schPinSpacing={0.75}
        schPortArrangement={{
          // Using simplified array syntax for all sides
          leftSide: [1, 2],
          rightSide: [5, 6],
          topSide: [3, 4],
          bottomSide: [7, 8],
        }}
        footprint="soic8"
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
    top_side?: { pins: number[]; direction?: string }
    bottom_side?: { pins: number[]; direction?: string }
  }
  expect(portArrangement).toBeDefined()
  expect(portArrangement?.left_side?.pins).toEqual([1, 2])
  expect(portArrangement?.right_side?.pins).toEqual([5, 6])
  expect(portArrangement?.top_side?.pins).toEqual([3, 4])
  expect(portArrangement?.bottom_side?.pins).toEqual([7, 8])

  // Default directions:
  // - Left/right sides: top-to-bottom
  // - Top/bottom sides: left-to-right
  expect(portArrangement?.left_side?.direction).toBe("top-to-bottom")
  expect(portArrangement?.right_side?.direction).toBe("top-to-bottom")
  expect(portArrangement?.top_side?.direction).toBe("left-to-right")
  expect(portArrangement?.bottom_side?.direction).toBe("left-to-right")

  expect(circuit.getCircuitJson()).toMatchSchematicSnapshot(import.meta.path)
})
