import type {
  ImplicitBreakoutBus,
  ImplicitBreakoutPointSolverInput,
  ImplicitBreakoutPointSolverOutput,
  ImplicitBreakoutRegion,
} from "@tscircuit/props"

export interface ImplicitBreakoutBusWinding {
  readonly busId: ImplicitBreakoutBus["busId"]
  readonly selectedLayer: string
  readonly connectionIdsInWindingOrder: readonly string[]
}

const getTangentPosition = (
  region: ImplicitBreakoutRegion,
  point: { readonly x: number; readonly y: number },
): number =>
  region.edge === "left" || region.edge === "right" ? point.y : point.x

/**
 * Enforce the Core implicit-breakout boundary contract for declared buses:
 * one layer per whole bus and one board-world tangent order at every package.
 * Opposing package-local frames are thereby mirrored exactly once rather than
 * allowing per-lane reversal.
 */
export const validateImplicitBreakoutBusOutput = (
  input: ImplicitBreakoutPointSolverInput,
  output: ImplicitBreakoutPointSolverOutput,
): readonly ImplicitBreakoutBusWinding[] => {
  const pointByRegionAndConnection = new Map(
    output.breakoutPoints.map((point) => [
      `${point.regionId}:${point.connectionId}`,
      point,
    ]),
  )
  const windings: ImplicitBreakoutBusWinding[] = []

  for (const bus of [...input.buses].sort((first, second) =>
    first.busId.localeCompare(second.busId),
  )) {
    const busLayers = new Set<string>()
    const orderByRegion: string[][] = []
    for (const region of input.regions) {
      const points = bus.connectionIds.map((connectionId) => {
        const point = pointByRegionAndConnection.get(
          `${region.regionId}:${connectionId}`,
        )
        if (!point) {
          throw new Error(
            `Implicit breakout bus "${bus.busId}" is missing connection "${connectionId}" in region "${region.regionId}"`,
          )
        }
        busLayers.add(point.layer)
        return point
      })
      points.sort(
        (first, second) =>
          getTangentPosition(region, first) -
            getTangentPosition(region, second) ||
          first.connectionId.localeCompare(second.connectionId),
      )
      orderByRegion.push(points.map((point) => point.connectionId))
    }

    if (busLayers.size !== 1) {
      throw new Error(
        `Implicit breakout bus "${bus.busId}" must use one layer, received ${[
          ...busLayers,
        ].join(", ")}`,
      )
    }
    const selectedLayer = [...busLayers][0]!
    const targetLayers = bus.targetLayers ?? ["top"]
    if (!targetLayers.includes(selectedLayer)) {
      throw new Error(
        `Implicit breakout bus "${bus.busId}" selected layer "${selectedLayer}" outside its allowed layers`,
      )
    }

    const referenceOrder = orderByRegion[0] ?? []
    for (
      let regionIndex = 1;
      regionIndex < orderByRegion.length;
      regionIndex++
    ) {
      const regionOrder = orderByRegion[regionIndex]!
      if (
        referenceOrder.length !== regionOrder.length ||
        referenceOrder.some(
          (connectionId, index) => connectionId !== regionOrder[index],
        )
      ) {
        throw new Error(
          `Implicit breakout bus "${bus.busId}" reverses winding between regions "${input.regions[0]!.regionId}" and "${input.regions[regionIndex]!.regionId}"`,
        )
      }
    }

    windings.push(
      Object.freeze({
        busId: bus.busId,
        selectedLayer,
        connectionIdsInWindingOrder: Object.freeze([...referenceOrder]),
      }),
    )
  }
  return Object.freeze(windings)
}
