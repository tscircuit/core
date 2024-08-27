import { expect, test, describe } from "bun:test"
import { getAllDimensionsForSchematicBox } from "lib/utils/schematic/getAllDimensionsForSchematicBox"
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
