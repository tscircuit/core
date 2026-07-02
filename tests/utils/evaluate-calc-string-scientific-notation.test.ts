import { describe, expect, test } from "bun:test"
import { evaluateCalcString } from "lib/utils/evaluateCalcString"

describe("evaluateCalcString scientific notation", () => {
  test("parses near-zero scientific notation values with a unit", () => {
    // Regression: a near-zero PCB coordinate stringified in scientific
    // notation (e.g. "1.1368683772161603e-13mm") previously caused the
    // tokenizer to treat the trailing "e" as an unknown unit and throw
    // "Unknown unit: e", surfacing as "Invalid pcbY value for SmtPad".
    expect(
      evaluateCalcString("1.1368683772161603e-13mm", { knownVariables: {} }),
    ).toBeCloseTo(0, 10)
  })

  test("parses positive and negative exponents", () => {
    expect(evaluateCalcString("1.5e3mm", { knownVariables: {} })).toBe(1500)
    expect(evaluateCalcString("2E-2mm", { knownVariables: {} })).toBeCloseTo(
      0.02,
      10,
    )
    expect(evaluateCalcString("1e+2mm", { knownVariables: {} })).toBe(100)
  })

  test("scientific notation works inside calc() with arithmetic", () => {
    expect(
      evaluateCalcString("calc(1e-13mm + 2mm)", { knownVariables: {} }),
    ).toBeCloseTo(2, 10)
  })

  test("plain numbers and units still parse correctly", () => {
    expect(evaluateCalcString("3mm", { knownVariables: {} })).toBe(3)
    expect(evaluateCalcString("0.5", { knownVariables: {} })).toBe(0.5)
  })
})
