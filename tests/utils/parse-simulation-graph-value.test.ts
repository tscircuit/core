import { expect, test } from "bun:test"
import { parseSimulationGraphValue } from "lib/utils/simulation/parseSimulationGraphValue"

test("parses scientific notation in string graph settings", () => {
  expect(parseSimulationGraphValue("1e-3V")).toBeCloseTo(1e-3)
  expect(parseSimulationGraphValue("1E-3")).toBeCloseTo(1e-3)
  expect(parseSimulationGraphValue("-1e-3V")).toBeCloseTo(-1e-3)
  expect(parseSimulationGraphValue("2.5e2mA")).toBeCloseTo(0.25)
})

test("scientific notation matches the numeric prop form", () => {
  expect(parseSimulationGraphValue("1e-3V")).toBe(parseSimulationGraphValue(1e-3))
})

test("existing SI prefix and plain number parsing is unchanged", () => {
  expect(parseSimulationGraphValue("1mV")).toBeCloseTo(1e-3)
  expect(parseSimulationGraphValue("500uA")).toBeCloseTo(5e-4)
  expect(parseSimulationGraphValue("3")).toBe(3)
  expect(parseSimulationGraphValue("0.5")).toBe(0.5)
  expect(parseSimulationGraphValue("abc")).toBeUndefined()
  expect(parseSimulationGraphValue(undefined)).toBeUndefined()
})
