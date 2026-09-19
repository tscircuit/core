import { expect, test } from "bun:test"
import { parseSimulationGraphValue } from "lib/utils/simulation/parseSimulationGraphValue"

test("parses scientific graph values before applying SI prefixes", () => {
  const cases: Array<[number | string, number]> = [
    ["1e-3V", 0.001],
    ["2E+3A", 2000],
    ["-2.5e-3V", -0.0025],
    [".5e-3A", 0.0005],
    ["+1.e+2V", 100],
    ["1e3mV", 1],
    [" 2.5E-2 kV ", 25],
    ["2mA", 0.002],
    ["2V", 2],
    ["3µA", 0.000003],
    [0.001, 0.001],
    [0, 0],
  ]
  for (const [input, expected] of cases) {
    expect(parseSimulationGraphValue(input)).toBeCloseTo(expected, 12)
  }
  expect(parseSimulationGraphValue(undefined)).toBeUndefined()
  expect(parseSimulationGraphValue("no value")).toBeUndefined()
  expect(parseSimulationGraphValue("1e309V")).toBeUndefined()
})
