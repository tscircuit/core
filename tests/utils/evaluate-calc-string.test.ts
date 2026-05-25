import { expect, test } from "bun:test"
import { evaluateCalcString } from "../../lib/utils/evaluateCalcString"

test("parses scientific notation with unit suffix", () => {
  expect(
    evaluateCalcString("-1.1368683772161603e-13mm", { knownVariables: {} }),
  ).toBeCloseTo(-1.1368683772161603e-13)
})

test("parses positive scientific notation with unit suffix", () => {
  expect(evaluateCalcString("1.5e-2mm", { knownVariables: {} })).toBeCloseTo(
    0.015,
  )
})

test("parses uppercase E exponent", () => {
  expect(evaluateCalcString("2E+3mm", { knownVariables: {} })).toBe(2000)
})

test("scientific notation works inside calc expressions", () => {
  expect(
    evaluateCalcString("calc(1e-13mm + 2mm)", { knownVariables: {} }),
  ).toBeCloseTo(2.0000000000000002)
})
