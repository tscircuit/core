import { expect, test } from "bun:test"
import { getFanoutBoundaryPointSpacing } from "lib/utils/autorouting/get-fanout-boundary-point-spacing"

test("fanout boundary spacing uses the same default via floor as FanoutSolver", () => {
  expect(
    getFanoutBoundaryPointSpacing({
      traceWidth: 0.08,
      traceToPadClearance: 0.05,
    }),
  ).toBe(0.56)
  expect(
    getFanoutBoundaryPointSpacing({
      traceWidth: 0.08,
      traceToPadClearance: 0.05,
      viaPadDiameter: 0.24,
    }),
  ).toBe(0.5)
})
