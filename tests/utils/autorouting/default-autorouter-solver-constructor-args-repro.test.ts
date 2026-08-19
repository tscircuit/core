import { expect, test } from "bun:test"
import { SOLVERS } from "lib/solvers"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getLocalAutorouterStrategy } from "lib/utils/autorouting/localAutorouterStrategies"

test.failing(
  "default autorouter emits constructor args that RunFrame can replay",
  () => {
    const simpleRouteJson: SimpleRouteJson = {
      layerCount: 2,
      minTraceWidth: 0.15,
      obstacles: [],
      connections: [],
      bounds: { minX: -1, maxX: 1, minY: -1, maxY: 1 },
    }
    const strategy = getLocalAutorouterStrategy("default")

    strategy.create({
      simpleRouteJson,
      commonAutorouterOptions: {},
      onSolverStarted: ({ solverName, solverConstructorArgs }) => {
        const SolverClass = SOLVERS[solverName] as new (
          ...args: any[]
        ) => unknown

        expect(() => new SolverClass(...solverConstructorArgs)).not.toThrow()
      },
    })
  },
)
