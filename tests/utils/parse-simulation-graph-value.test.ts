import { expect, test } from "bun:test"
import { parseSimulationGraphValue } from "lib/utils/simulation/parseSimulationGraphValue"

test("parseSimulationGraphValue handles scientific notation with and without SI prefixes", () => {
  // Scientific notation without SI prefix
  expect(parseSimulationGraphValue("1e-3V")).toBeCloseTo(0.001, 12)
  expect(parseSimulationGraphValue("5e-4A")).toBeCloseTo(0.0005, 12)
  expect(parseSimulationGraphValue("+1E-3A")).toBeCloseTo(0.001, 12)
  expect(parseSimulationGraphValue("-2.5e-3V")).toBeCloseTo(-0.0025, 12)
  expect(parseSimulationGraphValue("1.5e+2V")).toBeCloseTo(150, 12)
  expect(parseSimulationGraphValue(".5e-2V")).toBeCloseTo(0.005, 12)
  expect(parseSimulationGraphValue("2.e-1A")).toBeCloseTo(0.2, 12)
  expect(parseSimulationGraphValue("1e-3")).toBeCloseTo(0.001, 12)

  // Scientific notation combined with SI prefixes
  expect(parseSimulationGraphValue("5e2mV")).toBeCloseTo(0.5, 12)
  expect(parseSimulationGraphValue("1e3uA")).toBeCloseTo(0.001, 12)
  expect(parseSimulationGraphValue("2.5E-1kV")).toBeCloseTo(250, 12)
  expect(parseSimulationGraphValue(" 1.2e+3 uV ")).toBeCloseTo(0.0012, 12)

  // Existing decimal, SI-prefixed, numeric, and invalid inputs
  expect(parseSimulationGraphValue(undefined)).toBeUndefined()
  expect(parseSimulationGraphValue(1e-3)).toBe(0.001)
  expect(parseSimulationGraphValue(0)).toBe(0)
  expect(parseSimulationGraphValue("1mA")).toBeCloseTo(0.001, 12)
  expect(parseSimulationGraphValue("2.5µA")).toBeCloseTo(2.5e-6, 12)
  expect(parseSimulationGraphValue("10uA")).toBeCloseTo(1e-5, 12)
  expect(parseSimulationGraphValue("100nV")).toBeCloseTo(1e-7, 12)
  expect(parseSimulationGraphValue("250pA")).toBeCloseTo(2.5e-10, 15)
  expect(parseSimulationGraphValue("1kV")).toBe(1000)
  expect(parseSimulationGraphValue("1KV")).toBe(1000)
  expect(parseSimulationGraphValue("1MV")).toBe(1e6)
  expect(parseSimulationGraphValue("1GV")).toBe(1e9)
  expect(parseSimulationGraphValue("-0.5V")).toBe(-0.5)
  expect(parseSimulationGraphValue("")).toBeUndefined()
  expect(parseSimulationGraphValue("   ")).toBeUndefined()
  expect(parseSimulationGraphValue("invalid")).toBeUndefined()

  // Overflow to non-finite values returns undefined
  expect(parseSimulationGraphValue("1e309V")).toBeUndefined()
  expect(parseSimulationGraphValue("1e308kV")).toBeUndefined()
})
