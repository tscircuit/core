import { describe, expect, test } from "bun:test"
import { normalizePinLabels } from "../../../lib/utils/schematic/normalizePinLabels"

describe("normalizePinLabels", () => {
  test("handles the documentation example correctly", () => {
    const input = [["1", "GND"], ["2", "GND"], ["3", "VCC"], ["3"], ["4"]]

    expect(normalizePinLabels(input)).toEqual([
      ["pin1", "GND1"],
      ["pin2", "GND2"],
      ["pin3", "VCC"],
      ["pin5", "pin3_alt1"],
      ["pin4"],
    ])
  })

  test("handles empty input array", () => {
    expect(normalizePinLabels([])).toEqual([])
  })

  test("handles pins with no labels", () => {
    const input = [[], [], []]
    expect(normalizePinLabels(input)).toEqual([["pin1"], ["pin2"], ["pin3"]])
  })

  test("preserves unique non-numeric labels", () => {
    const input = [["VCC"], ["GND"], ["INPUT"]]
    expect(normalizePinLabels(input)).toEqual([
      ["pin1", "VCC"],
      ["pin2", "GND"],
      ["pin3", "INPUT"],
    ])
  })

  test("handles multiple labels per pin", () => {
    const input = [
      ["1", "VCC", "PWR"],
      ["2", "GND", "VSS"],
    ]
    expect(normalizePinLabels(input)).toEqual([
      ["pin1", "VCC", "PWR"],
      ["pin2", "GND", "VSS"],
    ])
  })

  test("handles duplicate numeric labels", () => {
    const input = [["1"], ["2"], ["2"], ["3"]]
    expect(normalizePinLabels(input)).toEqual([
      ["pin1"],
      ["pin2"],
      ["pin4", "pin2_alt1"],
      ["pin3"],
    ])
  })

  test("keeps alt labels unique when 3+ pins share a number", () => {
    const result = normalizePinLabels([["3"], ["3"], ["3"], ["3"]])

    expect(result).toEqual([
      ["pin3"],
      ["pin4", "pin3_alt1"],
      ["pin5", "pin3_alt2"],
      ["pin6", "pin3_alt3"],
    ])

    const allLabels = result.flat()
    expect(new Set(allLabels).size).toBe(allLabels.length)
  })
})
