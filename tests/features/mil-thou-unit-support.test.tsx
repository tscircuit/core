import { test, expect } from "bun:test"
import { evaluateCalcString } from "lib/utils/evaluateCalcString"

test("mil and thou units are supported in evaluateCalcString", () => {
  // 100mil = 100 * 0.0254mm = 2.54mm
  expect(evaluateCalcString("100mil", { knownVariables: {} })).toBeCloseTo(
    2.54,
    5,
  )

  // 1000thou = 1000 * 0.0254mm = 25.4mm
  expect(evaluateCalcString("1000thou", { knownVariables: {} })).toBeCloseTo(
    25.4,
    5,
  )

  // cm: 1cm = 10mm
  expect(evaluateCalcString("1cm", { knownVariables: {} })).toBeCloseTo(10, 5)

  // in: 1in = 25.4mm
  expect(evaluateCalcString("1in", { knownVariables: {} })).toBeCloseTo(25.4, 5)

  // Expression with mil: 50mil + 50mil = 2.54mm
  expect(
    evaluateCalcString("50mil + 50mil", { knownVariables: {} }),
  ).toBeCloseTo(2.54, 5)
})
