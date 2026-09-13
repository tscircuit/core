import { expect, test } from "bun:test"
import { parseSimulationGraphValue } from "lib/utils/simulation/parseSimulationGraphValue"

// https://github.com/tscircuit/core/issues/3732
// The numeric capture in parseSimulationGraphValue stops before the e/E of a
// signed exponent, so string graph settings like graphVoltagePerDiv="1e-3V"
// silently drop the exponent (and any SI prefix after it) instead of becoming
// 0.001. Numeric props are unaffected.

test("repro3732: scientific notation truncated in simulation graph settings", () => {
  // Current (buggy) values parsed from scientific-notation strings.
  // After the fix these should be 0.001, 0.0005 and 0.5 respectively —
  // update these assertions when the parsing is fixed.
  expect(parseSimulationGraphValue("1e-3V")).toBe(1)
  expect(parseSimulationGraphValue("5e-4A")).toBe(5)
  expect(parseSimulationGraphValue("5e2mV")).toBe(5)
  expect(parseSimulationGraphValue("+1E-3A")).toBe(1)

  // Decimal, SI-prefixed and numeric inputs already work and must keep working.
  expect(parseSimulationGraphValue("1mV")).toBe(0.001)
  expect(parseSimulationGraphValue("2.5V")).toBe(2.5)
  expect(parseSimulationGraphValue(1e-3)).toBe(0.001)
  expect(parseSimulationGraphValue("500uA")).toBe(0.0005)
})
