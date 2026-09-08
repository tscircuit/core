import { describe, expect, test } from "bun:test"
import { parseSimulationGraphValue } from "lib/utils/simulation/parseSimulationGraphValue"

describe("parseSimulationGraphValue", () => {
  test("passes through numbers and undefined", () => {
    expect(parseSimulationGraphValue(undefined)).toBeUndefined()
    expect(parseSimulationGraphValue(0.001)).toBe(0.001)
    expect(parseSimulationGraphValue(-2.5)).toBe(-2.5)
  })

  test("parses plain and signed decimal strings", () => {
    expect(parseSimulationGraphValue("1V")).toBe(1)
    expect(parseSimulationGraphValue("2.5V")).toBe(2.5)
    expect(parseSimulationGraphValue(".5V")).toBe(0.5)
    expect(parseSimulationGraphValue("+1.25V")).toBe(1.25)
    expect(parseSimulationGraphValue("-3.5V")).toBe(-3.5)
  })

  test("applies SI prefixes", () => {
    expect(parseSimulationGraphValue("1n")).toBe(1e-9)
    expect(parseSimulationGraphValue("2µF")).toBe(2e-6)
    expect(parseSimulationGraphValue("-3.5mA")).toBeCloseTo(-0.0035, 12)
    expect(parseSimulationGraphValue("+1.25kV")).toBe(1250)
    expect(parseSimulationGraphValue("1K")).toBe(1e3)
    expect(parseSimulationGraphValue("1M")).toBe(1e6)
    expect(parseSimulationGraphValue("1G")).toBe(1e9)
  })

  test("consumes scientific notation as part of the numeric value", () => {
    expect(parseSimulationGraphValue("1e-3V")).toBeCloseTo(0.001, 12)
    expect(parseSimulationGraphValue("5e-4A")).toBeCloseTo(0.0005, 12)
    expect(parseSimulationGraphValue("+1E-3A")).toBeCloseTo(0.001, 12)
    expect(parseSimulationGraphValue("2e3V")).toBe(2000)
    expect(parseSimulationGraphValue("1e+2V")).toBe(100)
    expect(parseSimulationGraphValue(".5e1V")).toBe(5)
  })

  test("applies the SI prefix after the exponent", () => {
    expect(parseSimulationGraphValue("5e2mV")).toBeCloseTo(0.5, 12)
    expect(parseSimulationGraphValue("1e3mA")).toBeCloseTo(1, 12)
    expect(parseSimulationGraphValue("2e-1kV")).toBeCloseTo(200, 12)
  })

  test("matches the equivalent numeric prop", () => {
    expect(parseSimulationGraphValue("1e-3V")).toBe(
      parseSimulationGraphValue(1e-3),
    )
    expect(parseSimulationGraphValue("5e-4A")).toBe(
      parseSimulationGraphValue(5e-4),
    )
  })

  test("does not treat a unit starting with 'e' as an exponent", () => {
    // "eV" is a unit, not an exponent, because no digits follow the "e"
    expect(parseSimulationGraphValue("1eV")).toBe(1)
    expect(parseSimulationGraphValue("5e")).toBe(5)
    expect(parseSimulationGraphValue("2e+V")).toBe(2)
  })

  test("returns undefined for unparseable and non-finite values", () => {
    expect(parseSimulationGraphValue("")).toBeUndefined()
    expect(parseSimulationGraphValue("abc")).toBeUndefined()
    expect(parseSimulationGraphValue("1e999V")).toBeUndefined()
  })
})
