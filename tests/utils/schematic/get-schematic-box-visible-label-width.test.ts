import { expect, test } from "bun:test"
import { getAllDimensionsForSchematicBox } from "lib/utils/schematic/getAllDimensionsForSchematicBox"

test("repro: minimum box width counts aliases instead of displayed text", () => {
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
  // Record current incorrect widths; controls below preserve explicit sizing.
  expect(getSize(aliases).width).toBeCloseTo(3.2)
  expect(getSize("A").width).toBeCloseTo(1.2)
  expect(getSize(["ALERT"]).width).toBeCloseTo(1.2)
  expect(getSize("ALERT").width).toBe(1.6)
  expect(getSize(["ALERT"], 2.5).width).toBe(2.5)
  expect(getSize([], 2.5).width).toBe(2.5)
  expect(getSize([]).width).toBe(0.5)
  expect(getSize(["𝑉"]).width).toBeCloseTo(1.2)
  expect(getSize("𝑉").width).toBeCloseTo(1.3)
})
