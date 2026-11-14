import { expect, test } from "bun:test"
import type { SolverStartedEvent } from "lib/events"
import { SOLVERS } from "lib/solvers"
import type {
  AutorouterOptions,
  AutorouterSolverName,
} from "lib/utils/autorouting/CapacityMeshAutorouter"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getLocalAutorouterStrategy } from "lib/utils/autorouting/local-autorouter-strategies"

const autorouterOptionsBySolver: Record<
  AutorouterSolverName,
  AutorouterOptions
> = {
  AutoroutingPipeline1_OriginalUnravel: {
    autorouterVersion: "beta_pipeline1",
  },
  AutoroutingPipelineSolver3_HgPortPointPathing: {
    autorouterVersion: "beta_pipeline3",
  },
  AutoroutingPipelineSolver4: { autorouterVersion: "beta_pipeline4" },
  AutoroutingPipelineSolver5: { autorouterVersion: "beta_pipeline5" },
  AutoroutingPipelineSolver7_MultiGraph: {
    autorouterVersion: "beta_pipeline7",
  },
  AutoroutingPipelineSolver8: { useLaserPrefabSolver: true },
  AutoroutingPipelineSolver9_PreloadedTraceGraph: { effort: 2 },
  AutoroutingPipelineSolver9_Networked: {
    platformConfig: { useCloudAutorouter: true },
    effort: 1,
  },
  AutoroutingPipelineSolver11_Simplification: {
    useTraceSimplificationSolver: true,
  },
  AssignableAutoroutingPipeline2: { useAssignableSolver: true },
  AssignableAutoroutingPipeline3: { useAutoJumperSolver: true },
}

test("replays every selectable autorouter from its emitted constructor args", () => {
  const strategy = getLocalAutorouterStrategy(undefined)
  const solverNames = Object.keys(
    autorouterOptionsBySolver,
  ) as AutorouterSolverName[]

  for (const solverName of solverNames) {
    const input: SimpleRouteJson = {
      layerCount: 2,
      minTraceWidth: 0.15,
      obstacles: [],
      connections: [
        {
          name: "VCC",
          pointsToConnect: [
            { x: -1, y: 0, layer: "top" },
            { x: 1, y: 0, layer: "top" },
          ],
        },
      ],
      bounds: { minX: -2, maxX: 2, minY: -2, maxY: 2 },
    }
    const commonAutorouterOptions = {
      capacityDepth: 3,
      targetMinCapacity: 0.2,
      ...autorouterOptionsBySolver[solverName],
    }
    const solverEvents: SolverStartedEvent[] = []
    strategy.create({
      simpleRouteJson: input,
      commonAutorouterOptions,
      onSolverStarted: (event) => {
        solverEvents.push({
          ...event,
          type: "solver:started",
          componentName: "replay test board",
        })
      },
    })

    expect(solverEvents).toHaveLength(1)
    const event = solverEvents[0]!
    expect(event.solverName).toBe(solverName)
    expect(event.solverConstructorArgs).toHaveLength(2)
    const constructorArgs = event.solverConstructorArgs!
    expect(constructorArgs[0]).toBe(input)
    expect(constructorArgs[1]).toEqual({
      capacityDepth: 3,
      targetMinCapacity: 0.2,
      cacheProvider: null,
      effort: commonAutorouterOptions.effort,
    })
    expect(
      Reflect.construct(SOLVERS[event.solverName], [...constructorArgs]),
    ).toBeInstanceOf(SOLVERS[event.solverName])
  }
})
