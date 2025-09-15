import { expect, test, describe } from "bun:test"
import { getAllDimensionsForSchematicBox } from "lib/utils/schematic/getAllDimensionsForSchematicBox"
import { getSchematicBoxSvg } from "./getSchematicBoxSvg"
import "tests/fixtures/extend-expect-any-svg"

test("getAllDimensionsForSchematicBox 1", () => {
  const params: Parameters<typeof getAllDimensionsForSchematicBox>[0] = {
    schWidth: 1,
    schPinSpacing: 0.2,
    numericSchPinStyle: {},
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
    numericSchPinStyle: {
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
    numericSchPinStyle: {
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
