import { expect, test } from "bun:test"
import type { SolverStartedEvent } from "lib/events"
import { SOLVERS } from "lib/solvers"
import { TscircuitAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

test("records the networked solver's effective effort in its constructor tuple", () => {
  const input: SimpleRouteJson = {
    layerCount: 2,
    minTraceWidth: 0.15,
    obstacles: [],
    connections: [],
    bounds: { minX: -2, maxX: 2, minY: -2, maxY: 2 },
  }
  const solverEvents: SolverStartedEvent[] = []
  new TscircuitAutorouter(input, {
    platformConfig: { useCloudAutorouter: true },
    onSolverStarted: (event) => {
      solverEvents.push({
        ...event,
        type: "solver:started",
        componentName: "networked replay test board",
      })
    },
  })

  expect(solverEvents).toHaveLength(1)
  const event = solverEvents[0]!
  expect(event.solverName).toBe("AutoroutingPipelineSolver9_Networked")
  expect(event.solverConstructorArgs).toHaveLength(2)
  const constructorArgs = event.solverConstructorArgs!
  expect(constructorArgs[0]).toBe(input)
  expect(constructorArgs[1]).toEqual({
    capacityDepth: undefined,
    targetMinCapacity: undefined,
    cacheProvider: null,
    effort: 1,
  })
  expect(constructorArgs[1]).toBe(event.solverParams.options)
  expect(
    Reflect.construct(SOLVERS[event.solverName], [...constructorArgs]),
  ).toBeInstanceOf(SOLVERS[event.solverName])
})
