import { expect, test } from "bun:test"
import { evaluateCalcString } from "lib/utils/evaluateCalcString"

test("calc coordinates reject non-finite arithmetic results", () => {
  const options = { knownVariables: { "board.width": 20 } }
  const invalidExpressions = [
    "calc(1mm / 0)",
    "calc(-1mm / 0)",
    "calc(0mm / 0)",
    "calc(1mm / (board.width - board.width))",
    `calc(${"9".repeat(400)}mm)`,
  ]

  for (const expression of invalidExpressions) {
    expect(() => evaluateCalcString(expression, options)).toThrow(
      "calc() expression must evaluate to a finite number",
    )
  }

  expect(evaluateCalcString("calc(0mm / 2)", options)).toBe(0)
  expect(evaluateCalcString("calc(-3mm + 2mm)", options)).toBe(-1)
  expect(evaluateCalcString("calc(board.width / 2 - 1mm)", options)).toBe(9)
})
