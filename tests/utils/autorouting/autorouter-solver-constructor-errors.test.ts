import { expect, test } from "bun:test"
import { getLocalAutorouterStrategy } from "lib/utils/autorouting/local-autorouter-strategies"

test("invalid autorouter input throws without emitting a successful start", () => {
  const strategy = getLocalAutorouterStrategy(undefined)
  let solverStarts = 0

  expect(() =>
    Reflect.apply(strategy.create, undefined, [
      {
        simpleRouteJson: {
          layerCount: 2,
          minTraceWidth: 0.15,
          connections: [],
          bounds: { minX: -2, maxX: 2, minY: -2, maxY: 2 },
          obstacles: undefined,
        },
        commonAutorouterOptions: {},
        onSolverStarted: () => {
          solverStarts++
        },
      },
    ]),
  ).toThrow(TypeError)
  expect(solverStarts).toBe(0)
})
