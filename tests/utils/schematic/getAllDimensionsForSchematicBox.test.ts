import { expect, test, describe } from "bun:test"
import { getAllDimensionsForSchematicBox, type ExplicitPinMappingArrangement } from "lib/utils/schematic/getAllDimensionsForSchematicBox"
import { getSchematicBoxSvg } from "./getSchematicBoxSvg"
import "tests/fixtures/extend-expect-any-svg"

test("getAllDimensionsForSchematicBox 1", () => {
  const params: Parameters<typeof getAllDimensionsForSchematicBox>[0] = {
    schWidth: 1,
    schPinSpacing: 0.2,
    schPinStyle: {},
    pinCount: 8,
  }

  const dimensions = getAllDimensionsForSchematicBox(params)

  expect(getSchematicBoxSvg(dimensions)).toMatchSvgSnapshot(
    import.meta.path,
    "schematicbox1",
  )
})

test("getAllDimensionsForSchematicBox 2 (pinStyle)", () => {
  const params: Parameters<typeof getAllDimensionsForSchematicBox>[0] = {
    schWidth: 1,
    schPinSpacing: 0.2,
    schPinStyle: {
      pin2: { bottomMargin: 0.5 },
      pin7: { topMargin: 0.5 },
    },
    pinCount: 8,
  }

  const dimensions = getAllDimensionsForSchematicBox(params)

  expect(getSchematicBoxSvg(dimensions)).toMatchSvgSnapshot(
    import.meta.path,
    "schematicbox2",
  )
})

test("getAllDimensionsForSchematicBox 3 (4 sided with margins)", () => {
  const params: Parameters<typeof getAllDimensionsForSchematicBox>[0] = {
    schPinSpacing: 0.2,
    schPinStyle: {
      pin6: { bottomMargin: 0.5 },
      pin9: { topMargin: 0.4 },
      pin13: { leftMargin: 0.2 },
    },
    schPortArrangement: {
      leftSize: 4,
      rightSize: 4,
      topSize: 4,
      bottomSize: 4,
    },
    pinCount: 16,
  }

  const dimensions = getAllDimensionsForSchematicBox(params)

  expect(getSchematicBoxSvg(dimensions)).toMatchSvgSnapshot(
    import.meta.path,
    "schematicbox3",
  )
})


test("getAllDimensionsForSchematicBox:  basic box with evenly distributed pins", () => {
  const params: Parameters<typeof getAllDimensionsForSchematicBox>[0] = {
    schWidth: 1,
    schPinSpacing: 0.2,
    schPinStyle: {},
    pinCount: 8,
  }

  const dimensions = getAllDimensionsForSchematicBox(params)

  expect(getSchematicBoxSvg(dimensions)).toMatchSvgSnapshot(
    import.meta.path,
    "schematicbox1",
  )

  // Verify pin count
  expect(dimensions.pinCount).toBe(8)

  // Verify size
  const size = dimensions.getSize()
  expect(size.width).toBe(1)
  expect(size.height).toBeGreaterThan(0)
})

test("getAllDimensionsForSchematicBox:box with pin style margins", () => {
  const params: Parameters<typeof getAllDimensionsForSchematicBox>[0] = {
    schWidth: 1,
    schPinSpacing: 0.2,
    schPinStyle: {
      pin2: { bottomMargin: 0.5 },
      pin7: { topMargin: 0.5 },
    },
    pinCount: 8,
  }

  const dimensions = getAllDimensionsForSchematicBox(params)

  expect(getSchematicBoxSvg(dimensions)).toMatchSvgSnapshot(
    import.meta.path,
    "schematicbox2",
  )

  // Verify pin positions
  const pin2Pos = dimensions.getPortPositionByPinNumber(2)
  const pin7Pos = dimensions.getPortPositionByPinNumber(7)
  expect(pin2Pos).not.toBeNull()
  expect(pin7Pos).not.toBeNull()
  expect(pin2Pos!.distanceFromOrthogonalEdge).toBeGreaterThan(0)
  expect(pin7Pos!.distanceFromOrthogonalEdge).toBeGreaterThan(0)
})

test("getAllDimensionsForSchematicBox: 4 sided box with margins", () => {
  const params: Parameters<typeof getAllDimensionsForSchematicBox>[0] = {
    schPinSpacing: 0.2,
    schPinStyle: {
      pin6: { bottomMargin: 0.5 },
      pin9: { topMargin: 0.4 },
      pin13: { leftMargin: 0.2 },
    },
    schPortArrangement: {
      leftSize: 4,
      rightSize: 4,
      topSize: 4,
      bottomSize: 4,
    },
    pinCount: 16,
  }

  const dimensions = getAllDimensionsForSchematicBox(params)

  expect(getSchematicBoxSvg(dimensions)).toMatchSvgSnapshot(
    import.meta.path,
    "schematicbox3",
  )
})

test("getAllDimensionsForSchematicBox: explicit pin mapping with directions", () => {
  const portArrangement: ExplicitPinMappingArrangement = {
    rightSide: {
      pins: [1, 2, 3, 4],
      direction: "bottom-to-top"
    },
    leftSide: {
      pins: [5, 6, 7, 8],
      direction: "top-to-bottom"
    }
  }

  const params: Parameters<typeof getAllDimensionsForSchematicBox>[0] = {
    schPinSpacing: 0.2,
    schPortArrangement: portArrangement,
    pinCount: 8,
  }

  const dimensions = getAllDimensionsForSchematicBox(params)

  // Verify right side pins are in reverse order (bottom to top)
  const pin1Pos = dimensions.getPortPositionByPinNumber(1)
  const pin4Pos = dimensions.getPortPositionByPinNumber(4)
  expect(pin1Pos!.y).toBeLessThan(pin4Pos!.y)

  // Verify left side pins are in normal order (top to bottom)
  const pin5Pos = dimensions.getPortPositionByPinNumber(5)
  const pin8Pos = dimensions.getPortPositionByPinNumber(8)
  expect(pin5Pos!.y).toBeGreaterThan(pin8Pos!.y)

  expect(getSchematicBoxSvg(dimensions)).toMatchSvgSnapshot(
    import.meta.path,
    "schematicbox4",
  )
})

test("getAllDimensionsForSchematicBox: explicit pin mapping with all sides", () => {
  const portArrangement: ExplicitPinMappingArrangement = {
    rightSide: {
      pins: [1, 2],
      direction: "bottom-to-top"
    },
    leftSide: {
      pins: [3, 4],
      direction: "top-to-bottom"
    },
    topSide: {
      pins: [5, 6],
      direction: "right-to-left"
    },
    bottomSide: {
      pins: [7, 8],
      direction: "left-to-right"
    }
  }

  const params: Parameters<typeof getAllDimensionsForSchematicBox>[0] = {
    schPinSpacing: 0.2,
    schPortArrangement: portArrangement,
    pinCount: 8,
  }

  const dimensions = getAllDimensionsForSchematicBox(params)

  // Verify positions for each side
  const pin1Pos = dimensions.getPortPositionByPinNumber(1)
  const pin2Pos = dimensions.getPortPositionByPinNumber(2)
  const pin3Pos = dimensions.getPortPositionByPinNumber(3)
  const pin4Pos = dimensions.getPortPositionByPinNumber(4)
  const pin5Pos = dimensions.getPortPositionByPinNumber(5)
  const pin6Pos = dimensions.getPortPositionByPinNumber(6)
  const pin7Pos = dimensions.getPortPositionByPinNumber(7)
  const pin8Pos = dimensions.getPortPositionByPinNumber(8)

  // Right side (bottom-to-top)
  expect(pin1Pos!.y).toBeLessThan(pin2Pos!.y)

  // Left side (top-to-bottom)
  expect(pin3Pos!.y).toBeGreaterThan(pin4Pos!.y)

  // Top side (right-to-left)
  expect(pin5Pos!.x).toBeGreaterThan(pin6Pos!.x)

  // Bottom side (left-to-right)
  expect(pin7Pos!.x).toBeLessThan(pin8Pos!.x)

  expect(getSchematicBoxSvg(dimensions)).toMatchSvgSnapshot(
    import.meta.path,
    "schematicbox5",
  )
})

test("getAllDimensionsForSchematicBox: invalid pin arrangement handling", () => {
  const params: Parameters<typeof getAllDimensionsForSchematicBox>[0] = {
    schPinSpacing: 0.2,
    schPortArrangement: {
      leftSize: 4,
      rightSize: 4,
    },
    pinCount: 16, // Mismatch with arrangement
  }

  expect(() => getAllDimensionsForSchematicBox(params)).not.toThrow()
})
