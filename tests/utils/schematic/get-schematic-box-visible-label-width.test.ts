import { expect, test } from "bun:test"
import { getAllDimensionsForSchematicBox } from "lib/utils/schematic/getAllDimensionsForSchematicBox"

test("minimum box width ignores hidden aliases and preserves explicit width", () => {
  const getSize = (pinLabel: string | readonly string[], schWidth?: number) =>
    getAllDimensionsForSchematicBox({
      pinCount: 1,
      schPinSpacing: 0.2,
      schWidth,
      pinLabels: { pin1: pinLabel },
      schPortArrangement: {
        leftSide: { pins: [1], direction: "top-to-bottom" },
      },
    }).getSize()

  const aliases = ["A", ...Array.from({ length: 20 }, (_, n) => `alias_${n}`)]
  expect(getSize(aliases)).toEqual(getSize("A"))
  expect(getSize(["ALERT"])).toEqual(getSize("ALERT"))
  expect(getSize("ALERT").width).toBe(1.6)
  expect(getSize(["ALERT"], 2.5).width).toBe(2.5)
  expect(getSize([], 2.5).width).toBe(2.5)
  expect(getSize([]).width).toBe(0.5)
  expect(getSize(["𝑉"]).width).toBe(getSize("𝑉").width)
})
