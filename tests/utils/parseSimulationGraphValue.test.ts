import { test, expect } from "bun:test"
import { parseSimulationGraphValue } from "lib/utils/simulation/parseSimulationGraphValue"

test("parseSimulationGraphValue parses scientific notation correctly (#3732)", () => {
  expect(parseSimulationGraphValue("1e-3V")).toBe(0.001)
  expect(parseSimulationGraphValue("5e-4A")).toBe(0.0005)
  expect(parseSimulationGraphValue("5e2mV")).toBe(0.5)
  expect(parseSimulationGraphValue("+1E-3A")).toBe(0.001)
  expect(parseSimulationGraphValue("-2.5e-6V")).toBe(-0.0000025)
})

test("parseSimulationGraphValue preserves existing SI prefixes and decimals", () => {
  expect(parseSimulationGraphValue("10V")).toBe(10)
  expect(parseSimulationGraphValue("10mV")).toBe(0.01)
  expect(parseSimulationGraphValue("1.5k")).toBe(1500)
  expect(parseSimulationGraphValue("-2.5u")).toBeCloseTo(-0.0000025)
  expect(parseSimulationGraphValue("100")).toBe(100)
})

test("parseSimulationGraphValue handles numeric values and edge cases", () => {
  expect(parseSimulationGraphValue(1e-3)).toBe(0.001)
  expect(parseSimulationGraphValue(50)).toBe(50)
  expect(parseSimulationGraphValue(undefined)).toBeUndefined()
  expect(parseSimulationGraphValue("invalid")).toBeUndefined()
  expect(parseSimulationGraphValue("")).toBeUndefined()
})
