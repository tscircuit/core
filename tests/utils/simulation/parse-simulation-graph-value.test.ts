import { expect, test } from "bun:test"
import { parseSimulationGraphValue } from "lib/utils/simulation/parseSimulationGraphValue"

test("parseSimulationGraphValue handles undefined and numeric values", () => {
  expect(parseSimulationGraphValue(undefined)).toBeUndefined()
  expect(parseSimulationGraphValue(0)).toBe(0)
  expect(parseSimulationGraphValue(42)).toBe(42)
  expect(parseSimulationGraphValue(-3.14)).toBe(-3.14)
})

test("parseSimulationGraphValue handles basic string values with SI prefixes", () => {
  expect(parseSimulationGraphValue("5V")).toBe(5)
  expect(parseSimulationGraphValue("100mA")).toBeCloseTo(0.1)
  expect(parseSimulationGraphValue("10uV")).toBeCloseTo(1e-5)
  expect(parseSimulationGraphValue("20µA")).toBeCloseTo(2e-5)
  expect(parseSimulationGraphValue("2.5k")).toBe(2500)
  expect(parseSimulationGraphValue("1M")).toBe(1e6)
  expect(parseSimulationGraphValue("1G")).toBe(1e9)
  expect(parseSimulationGraphValue("500p")).toBeCloseTo(500e-12)
  expect(parseSimulationGraphValue("10n")).toBeCloseTo(10e-9)
})

test("parseSimulationGraphValue handles scientific notation (issue #3732)", () => {
  expect(parseSimulationGraphValue("1e-3V")).toBeCloseTo(0.001)
  expect(parseSimulationGraphValue("1e-3")).toBeCloseTo(0.001)
  expect(parseSimulationGraphValue("1E-3")).toBeCloseTo(0.001)
  expect(parseSimulationGraphValue("+1e-3V")).toBeCloseTo(0.001)
  expect(parseSimulationGraphValue("-2.5e-6A")).toBeCloseTo(-2.5e-6)
  expect(parseSimulationGraphValue("5e2mV")).toBeCloseTo(0.5)
  expect(parseSimulationGraphValue("1.2e+4")).toBe(12000)
  expect(parseSimulationGraphValue("  -3.4e-2 V  ")).toBeCloseTo(-0.034)
})

test("parseSimulationGraphValue handles invalid strings gracefully", () => {
  expect(parseSimulationGraphValue("")).toBeUndefined()
  expect(parseSimulationGraphValue("abc")).toBeUndefined()
  expect(parseSimulationGraphValue("not-a-number")).toBeUndefined()
})
