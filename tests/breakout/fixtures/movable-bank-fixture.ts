import type {
  ImplicitBreakoutBus,
  ImplicitBreakoutPointSolverInput,
  ImplicitBreakoutPointSolverOutput,
} from "@tscircuit/props"
import type { ImplicitBreakoutBankPlanningContext } from "lib/components/primitive-components/Breakout/plan-implicit-breakout-banks"

export interface MovableBankBusFixture {
  readonly busId: string
  readonly count: number
  readonly layer: string
  readonly sourceTangentCenter?: number
}

export const createMovableBankFixture = ({
  buses,
  boundaryPointSpacing = 1,
  boardBounds = { minX: -15, maxX: 15, minY: -15, maxY: 15 },
  channelGap = 16,
  shuffle = false,
}: {
  buses: readonly MovableBankBusFixture[]
  boundaryPointSpacing?: number
  boardBounds?: ImplicitBreakoutBankPlanningContext["boardBounds"]
  channelGap?: number
  shuffle?: boolean
}): {
  input: ImplicitBreakoutPointSolverInput
  baseOutput: ImplicitBreakoutPointSolverOutput
  context: ImplicitBreakoutBankPlanningContext
} => {
  const channelHalfGap = channelGap / 2
  const regions = [
    {
      regionId: "left-package",
      bounds: {
        minX: -channelHalfGap - 4,
        maxX: -channelHalfGap,
        minY: -10,
        maxY: 10,
      },
      edge: "right" as const,
    },
    {
      regionId: "right-package",
      bounds: {
        minX: channelHalfGap,
        maxX: channelHalfGap + 4,
        minY: -10,
        maxY: 10,
      },
      edge: "left" as const,
    },
  ]
  const solverBuses: ImplicitBreakoutBus[] = []
  const connections: ImplicitBreakoutPointSolverInput["connections"][number][] =
    []
  const breakoutPoints: ImplicitBreakoutPointSolverOutput["breakoutPoints"][number][] =
    []
  for (const [busIndex, bus] of buses.entries()) {
    const connectionIds = Array.from(
      { length: bus.count },
      (_, connectionIndex) => `${bus.busId}-lane-${connectionIndex}`,
    )
    solverBuses.push({
      busId: bus.busId,
      connectionIds,
      targetLayers: [bus.layer],
    })
    const sourceTangentCenter =
      bus.sourceTangentCenter ??
      (busIndex - (buses.length - 1) / 2) * boundaryPointSpacing * bus.count
    for (const [connectionIndex, connectionId] of connectionIds.entries()) {
      const tangent =
        sourceTangentCenter +
        (connectionIndex - (connectionIds.length - 1) / 2) *
          boundaryPointSpacing
      connections.push({
        connectionId,
        endpoints: regions.map((region) => ({
          regionId: region.regionId,
          position: {
            x:
              region.regionId === "left-package"
                ? -channelHalfGap - 2
                : channelHalfGap + 2,
            y: tangent,
          },
        })),
      })
      breakoutPoints.push(
        ...regions.map((region) => ({
          regionId: region.regionId,
          connectionId,
          layer: bus.layer,
          x: region.edge === "right" ? region.bounds.maxX : region.bounds.minX,
          y: tangent,
        })),
      )
    }
  }
  const maybeShuffle = <Value>(values: readonly Value[]): Value[] =>
    shuffle ? [...values].reverse() : [...values]
  return {
    input: {
      regions,
      connections: maybeShuffle(connections),
      buses: maybeShuffle(solverBuses).map((bus) => ({
        ...bus,
        connectionIds: maybeShuffle(bus.connectionIds),
      })),
      boundaryPointSpacing,
    },
    baseOutput: { breakoutPoints: maybeShuffle(breakoutPoints) },
    context: { boardBounds },
  }
}
