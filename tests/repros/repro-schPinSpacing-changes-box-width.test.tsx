import { test, expect } from "bun:test"
import { getAllDimensionsForSchematicBox } from "lib/utils/schematic/getAllDimensionsForSchematicBox"

test("schPinSpacing should not change the width of the schematic box", () => {
  // Test with different pin spacings but same port arrangement
  const baseParams = {
    schPortArrangement: {
      leftSize: 2,
      rightSize: 2,
      topSize: 2,
      bottomSize: 2,
    },
    pinCount: 8,
    numericSchPinStyle: {},
  }

  // Get dimensions with default spacing (0.2)
  const dims1 = getAllDimensionsForSchematicBox({
    ...baseParams,
    schPinSpacing: 0.2,
  })
  const size1 = dims1.getSize()

  // Get dimensions with larger spacing (0.5)
  const dims2 = getAllDimensionsForSchematicBox({
    ...baseParams,
    schPinSpacing: 0.5,
  })
  const size2 = dims2.getSize()

  // Get dimensions with even larger spacing (1.0)
  const dims3 = getAllDimensionsForSchematicBox({
    ...baseParams,
    schPinSpacing: 1.0,
  })
  const size3 = dims3.getSize()

  console.log("Width with spacing 0.2:", size1.width)
  console.log("Width with spacing 0.5:", size2.width)
  console.log("Width with spacing 1.0:", size3.width)
  console.log("Height with spacing 0.2:", size1.height)
  console.log("Height with spacing 0.5:", size2.height)
  console.log("Height with spacing 1.0:", size3.height)

  // Width should remain constant regardless of pin spacing
  expect(size1.width).toBe(size2.width)
  expect(size2.width).toBe(size3.width)

  // Height is expected to change with spacing (left/right pins)
  expect(size1.height).toBeLessThan(size2.height)
  expect(size2.height).toBeLessThan(size3.height)
})
