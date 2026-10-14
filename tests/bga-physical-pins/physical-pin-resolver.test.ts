import { expect, test } from "bun:test"
import { parsePinNumberFromLabelsOrThrow } from "lib/utils/schematic/parsePinNumberFromLabelsOrThrow"
import { resolvePinLabels } from "lib/utils/schematic/resolvePinLabels"

test("physical pin resolution preserves numeric compatibility, ordering and ambiguity diagnostics", () => {
  const labels = {
    AA1: "TAIL",
    A10: "DQ10",
    pin2: ["LEGACY"],
    A2: "DQ2",
    A1: "GND",
    B1: "GND",
  }
  const resolved = resolvePinLabels(labels)
  expect(
    resolved
      .filter((p) => p.physicalPinName)
      .sort((a, b) => a.pinNumber - b.pinNumber)
      .map((p) => [p.physicalPinName, p.pinNumber]),
  ).toEqual([
    ["A1", 1],
    ["A2", 3],
    ["A10", 4],
    ["B1", 5],
    ["AA1", 6],
  ])
  expect(parsePinNumberFromLabelsOrThrow("DQ2", labels)).toBe(3)
  expect(parsePinNumberFromLabelsOrThrow("A2", labels)).toBe(3)
  expect(parsePinNumberFromLabelsOrThrow("LEGACY", labels)).toBe(2)
  expect(parsePinNumberFromLabelsOrThrow("DQ0", { pin1: ["A1", "DQ0"] })).toBe(
    1,
  )
  expect(() => parsePinNumberFromLabelsOrThrow("GND", labels)).toThrow(
    'Ambiguous pin label "GND"',
  )
  expect(() => parsePinNumberFromLabelsOrThrow("A99", labels)).toThrow('"A99"')
  expect(
    resolvePinLabels(Object.fromEntries(Object.entries(labels).reverse())).sort(
      (a, b) => a.pinNumber - b.pinNumber,
    ),
  ).toEqual(resolved.sort((a, b) => a.pinNumber - b.pinNumber))
})
