import {
  type FanoutBorderTarget,
  type FanoutDirection,
  FanoutSolver,
  type FanoutSolverOptions,
} from "@tscircuit/fanout-solver"
import type {
  BusFanoutDirection,
  FanoutBoundaryPadding,
  NinePointAnchor,
} from "@tscircuit/props"
import { getViaBoardLayers } from "../getViaSpanLayers"
import type {
  AutorouterCompleteEvent,
  AutorouterErrorEvent,
  AutorouterEvent,
  AutorouterProgressEvent,
  GenericLocalAutorouter,
} from "./GenericLocalAutorouter"
import type {
  SimpleRouteBounds,
  SimpleRouteBus,
  SimpleRouteJson,
  SimpleRoutePoint,
  SimplifiedPcbTrace,
} from "./SimpleRouteJson"
import { getFanoutSharedBoundary } from "./get-fanout-shared-boundary"

export type FanoutAutorouterMode = "single_layer_fanout" | "fanout"

export interface FanoutAutorouterOptions {
  mode: FanoutAutorouterMode
  busFanoutDirections?: Readonly<Record<string, BusFanoutDirection>>
  fanoutBounds?: SimpleRouteBounds
  fanoutRoutingLayers?: string[]
}

export interface ResolveFanoutBoundsOptions extends FanoutAutorouterOptions {
  fanoutBoundaryPadding?: FanoutBoundaryPadding
  breakoutPoints?: ReadonlyArray<{ x: number; y: number }>
  onFanoutBoundsConflict?: () => void
}

const boundsDiffer = (
  first: SimpleRouteBounds,
  second: SimpleRouteBounds,
): boolean =>
  Math.abs(first.minX - second.minX) > 1e-6 ||
  Math.abs(first.maxX - second.maxX) > 1e-6 ||
  Math.abs(first.minY - second.minY) > 1e-6 ||
  Math.abs(first.maxY - second.maxY) > 1e-6

const expandBoundsToIncludePoints = (
  bounds: SimpleRouteBounds | undefined,
  points: ReadonlyArray<{ x: number; y: number }>,
): SimpleRouteBounds | undefined => {
  if (!bounds && points.length === 0) return undefined

  return {
    minX: Math.min(
      bounds?.minX ?? Number.POSITIVE_INFINITY,
      ...points.map((p) => p.x),
    ),
    maxX: Math.max(
      bounds?.maxX ?? Number.NEGATIVE_INFINITY,
      ...points.map((p) => p.x),
    ),
    minY: Math.min(
      bounds?.minY ?? Number.POSITIVE_INFINITY,
      ...points.map((p) => p.y),
    ),
    maxY: Math.max(
      bounds?.maxY ?? Number.NEGATIVE_INFINITY,
      ...points.map((p) => p.y),
    ),
  }
}

const getNinePointAnchor = (
  fanoutDirection: BusFanoutDirection,
): NinePointAnchor =>
  typeof fanoutDirection === "string"
    ? fanoutDirection
    : fanoutDirection.direction

const getFanoutBorderTarget = (
  anchor: NinePointAnchor,
): FanoutBorderTarget | undefined => {
  switch (anchor) {
    case "top_left":
      return "top-left"
    case "top_center":
      return "top"
    case "top_right":
      return "top-right"
    case "center_left":
      return "left"
    case "center":
      return undefined
    case "center_right":
      return "right"
    case "bottom_left":
      return "bottom-left"
    case "bottom_center":
      return "bottom"
    case "bottom_right":
      return "bottom-right"
  }
}

const getPlaneFanoutDirection = (
  anchor: NinePointAnchor,
): FanoutDirection | undefined => {
  switch (anchor) {
    case "top_left":
    case "top_center":
    case "top_right":
      return "up"
    case "center_left":
      return "left"
    case "center":
      return undefined
    case "center_right":
      return "right"
    case "bottom_left":
    case "bottom_center":
    case "bottom_right":
      return "down"
  }
}

const getSourceComponentIdForPoint = (
  input: SimpleRouteJson,
  point: SimpleRoutePoint,
): string | undefined => {
  const matchingObstacle = input.obstacles.find(
    (obstacle) =>
      obstacle.componentId &&
      obstacle.layers.includes(point.layer) &&
      ((point.pointId && obstacle.connectedTo.includes(point.pointId)) ||
        (point.x >= obstacle.center.x - obstacle.width / 2 &&
          point.x <= obstacle.center.x + obstacle.width / 2 &&
          point.y >= obstacle.center.y - obstacle.height / 2 &&
          point.y <= obstacle.center.y + obstacle.height / 2)),
  )
  return matchingObstacle?.componentId
}

/**
 * Plane drops do not have a board-level target from which to infer a direction.
 * Choose an internal via escape orientation from each source pad's position
 * within its component instead of requiring a user-facing bus direction.
 */
const inferPlaneBusDirection = (
  input: SimpleRouteJson,
  bus: SimpleRouteBus,
): FanoutDirection | undefined => {
  const connectionNames = new Set(bus.connectionNames)
  const sourcePointsByComponentId = new Map<string, SimpleRoutePoint[]>()
  for (const connection of input.connections) {
    if (!connectionNames.has(connection.name)) continue
    for (const point of connection.pointsToConnect) {
      const componentId = getSourceComponentIdForPoint(input, point)
      if (!componentId) continue
      const sourcePoints = sourcePointsByComponentId.get(componentId) ?? []
      sourcePoints.push(point)
      sourcePointsByComponentId.set(componentId, sourcePoints)
    }
  }
  const sourceComponent = [...sourcePointsByComponentId.entries()].sort(
    ([firstComponentId, firstPoints], [secondComponentId, secondPoints]) =>
      secondPoints.length - firstPoints.length ||
      firstComponentId.localeCompare(secondComponentId),
  )[0]
  if (!sourceComponent) return undefined

  const [sourceComponentId, sourcePoints] = sourceComponent
  const componentObstacles = input.obstacles.filter(
    (obstacle) => obstacle.componentId === sourceComponentId,
  )
  if (componentObstacles.length === 0) return undefined

  const componentXCoordinates = componentObstacles.map(
    (obstacle) => obstacle.center.x,
  )
  const componentYCoordinates = componentObstacles.map(
    (obstacle) => obstacle.center.y,
  )
  const minComponentX = Math.min(...componentXCoordinates)
  const maxComponentX = Math.max(...componentXCoordinates)
  const minComponentY = Math.min(...componentYCoordinates)
  const maxComponentY = Math.max(...componentYCoordinates)
  const componentCenter = {
    x: (minComponentX + maxComponentX) / 2,
    y: (minComponentY + maxComponentY) / 2,
  }
  const componentHalfSpan = {
    x: Math.max((maxComponentX - minComponentX) / 2, 1e-6),
    y: Math.max((maxComponentY - minComponentY) / 2, 1e-6),
  }
  const averageSourcePoint = {
    x:
      sourcePoints.reduce((sum, point) => sum + point.x, 0) /
      sourcePoints.length,
    y:
      sourcePoints.reduce((sum, point) => sum + point.y, 0) /
      sourcePoints.length,
  }
  const normalizedOffset = {
    x: (averageSourcePoint.x - componentCenter.x) / componentHalfSpan.x,
    y: (averageSourcePoint.y - componentCenter.y) / componentHalfSpan.y,
  }

  if (Math.abs(normalizedOffset.x) > Math.abs(normalizedOffset.y)) {
    return normalizedOffset.x >= 0 ? "right" : "left"
  }
  if (Math.abs(normalizedOffset.y) > 1e-9) {
    return normalizedOffset.y >= 0 ? "up" : "down"
  }
  return "right"
}

const createDownstreamSimpleRouteJson = ({
  fanoutSimpleRouteJson,
  sourceComponentIds,
}: {
  fanoutSimpleRouteJson: SimpleRouteJson
  sourceComponentIds: Set<string>
}): SimpleRouteJson => {
  const sourceObstaclesByComponentId = new Map<
    string,
    SimpleRouteJson["obstacles"]
  >()
  for (const obstacle of fanoutSimpleRouteJson.obstacles) {
    if (
      !obstacle.componentId ||
      !sourceComponentIds.has(obstacle.componentId)
    ) {
      continue
    }
    const sourceObstacles =
      sourceObstaclesByComponentId.get(obstacle.componentId) ?? []
    sourceObstacles.push(obstacle)
    sourceObstaclesByComponentId.set(obstacle.componentId, sourceObstacles)
  }
  const sourceFootprintKeepouts: SimpleRouteJson["obstacles"] = []
  for (const [componentId, sourceObstacles] of sourceObstaclesByComponentId) {
    const minX = Math.min(
      ...sourceObstacles.map(
        (obstacle) => obstacle.center.x - obstacle.width / 2,
      ),
    )
    const maxX = Math.max(
      ...sourceObstacles.map(
        (obstacle) => obstacle.center.x + obstacle.width / 2,
      ),
    )
    const minY = Math.min(
      ...sourceObstacles.map(
        (obstacle) => obstacle.center.y - obstacle.height / 2,
      ),
    )
    const maxY = Math.max(
      ...sourceObstacles.map(
        (obstacle) => obstacle.center.y + obstacle.height / 2,
      ),
    )
    sourceFootprintKeepouts.push({
      obstacleId: `fanout-source-keepout:${componentId}`,
      type: "rect",
      layers: getViaBoardLayers(fanoutSimpleRouteJson.layerCount),
      center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
      width: maxX - minX,
      height: maxY - minY,
      connectedTo: [],
    })
  }
  return {
    ...fanoutSimpleRouteJson,
    obstacles: [
      ...fanoutSimpleRouteJson.obstacles.filter(
        (obstacle) =>
          !obstacle.componentId ||
          !sourceComponentIds.has(obstacle.componentId),
      ),
      ...sourceFootprintKeepouts,
    ],
  }
}

export class FanoutAutorouter implements GenericLocalAutorouter {
  isRouting = false
  private outputSimpleRouteJson?: SimpleRouteJson
  private startTimeoutId?: number
  private eventHandlers: {
    complete: Array<(event: AutorouterCompleteEvent) => void>
    error: Array<(event: AutorouterErrorEvent) => void>
    progress: Array<(event: AutorouterProgressEvent) => void>
  } = {
    complete: [],
    error: [],
    progress: [],
  }

  constructor(
    public readonly input: SimpleRouteJson,
    private readonly options: FanoutAutorouterOptions,
  ) {}

  private getBusExitPreferences():
    | Readonly<Record<string, FanoutBorderTarget>>
    | undefined {
    if (!this.options.busFanoutDirections) return undefined
    const knownBusIds = new Set(this.input.buses?.map((bus) => bus.busId) ?? [])
    const planeBusIds = new Set(
      this.input.buses
        ?.filter((bus) => bus.termination?.type === "plane")
        .map((bus) => bus.busId) ?? [],
    )
    const preferences: Record<string, FanoutBorderTarget> = {}
    for (const [busId, fanoutDirection] of Object.entries(
      this.options.busFanoutDirections,
    )) {
      if (!knownBusIds.has(busId)) {
        throw new Error(
          `Fanout direction references unknown bus "${busId}" in this autorouting phase`,
        )
      }
      if (planeBusIds.has(busId)) continue
      const target = getFanoutBorderTarget(getNinePointAnchor(fanoutDirection))
      if (target) preferences[busId] = target
    }
    return Object.keys(preferences).length > 0 ? preferences : undefined
  }

  private getPlaneBusDirections():
    | Readonly<Record<string, FanoutDirection>>
    | undefined {
    const planeBuses =
      this.input.buses?.filter((bus) => bus.termination?.type === "plane") ?? []
    const planeBusIds = new Set(planeBuses.map((bus) => bus.busId))
    const directions: Record<string, FanoutDirection> = {}
    for (const [busId, fanoutDirection] of Object.entries(
      this.options.busFanoutDirections ?? {},
    )) {
      if (!planeBusIds.has(busId)) continue
      const direction = getPlaneFanoutDirection(
        getNinePointAnchor(fanoutDirection),
      )
      if (direction) directions[busId] = direction
    }
    for (const planeBus of planeBuses) {
      if (directions[planeBus.busId]) continue
      const direction = inferPlaneBusDirection(this.input, planeBus)
      if (direction) directions[planeBus.busId] = direction
    }
    return Object.keys(directions).length > 0 ? directions : undefined
  }

  private getFanoutSolverOptions(): FanoutSolverOptions {
    const commonOptions: FanoutSolverOptions = {
      borderDistribution: "even",
      compactBusTracks: true,
      busDirections: this.getPlaneBusDirections(),
      busExitPreferences: this.getBusExitPreferences(),
      escapeLayers: this.options.fanoutRoutingLayers,
    }
    if (this.options.mode === "single_layer_fanout") {
      return {
        ...commonOptions,
        escapeLayers: ["top"],
        singleLayerPushAndShove: true,
      }
    }
    return commonOptions
  }

  static resolveFanoutBounds(
    input: SimpleRouteJson,
    options: ResolveFanoutBoundsOptions,
  ): SimpleRouteBounds | undefined {
    let paddingBounds: SimpleRouteBounds | undefined
    if (options.fanoutBoundaryPadding !== undefined) {
      const boundsResolver = new FanoutAutorouter(input, options)
      const fanoutSolver = new FanoutSolver(
        input as unknown as ConstructorParameters<typeof FanoutSolver>[0],
        boundsResolver.getFanoutSolverOptions(),
      )
      paddingBounds = getFanoutSharedBoundary({
        preparedBuses: fanoutSolver.preparedBuses,
        padding: options.fanoutBoundaryPadding,
      })
    }

    if (
      options.fanoutBounds &&
      paddingBounds &&
      boundsDiffer(options.fanoutBounds, paddingBounds)
    ) {
      options.onFanoutBoundsConflict?.()
    }

    return expandBoundsToIncludePoints(
      options.fanoutBounds ?? paddingBounds,
      options.breakoutPoints ?? [],
    )
  }

  private solveFanout(): {
    downstreamSimpleRouteJson: SimpleRouteJson
    fanoutTraces: SimplifiedPcbTrace[]
    debugGraphics: AutorouterProgressEvent["debugGraphics"]
  } {
    const fanoutSolverOptions = this.getFanoutSolverOptions()
    const fanoutSolver = new FanoutSolver(
      this.input as unknown as ConstructorParameters<typeof FanoutSolver>[0],
      {
        ...fanoutSolverOptions,
        ...(this.options.fanoutBounds
          ? { sharedBoundary: this.options.fanoutBounds }
          : {}),
      },
    )
    fanoutSolver.solve()
    if (fanoutSolver.failed) {
      throw new Error(fanoutSolver.error ?? "Fanout routing failed")
    }
    const output = fanoutSolver.getOutput()
    const fanoutSimpleRouteJson =
      output.simpleRouteJson as unknown as SimpleRouteJson
    const fanoutTraces = output.fanoutTraces as unknown as SimplifiedPcbTrace[]
    return {
      downstreamSimpleRouteJson: createDownstreamSimpleRouteJson({
        fanoutSimpleRouteJson,
        sourceComponentIds: new Set(
          fanoutSolver.preparedBuses.map((bus) => bus.componentId),
        ),
      }),
      fanoutTraces,
      debugGraphics: fanoutSolver.visualize(),
    }
  }

  private startFanout(): void {
    try {
      const { downstreamSimpleRouteJson, fanoutTraces, debugGraphics } =
        this.solveFanout()
      if (!this.isRouting) return
      this.outputSimpleRouteJson = downstreamSimpleRouteJson

      this.emitEvent({
        type: "progress",
        steps: 1,
        progress: 1,
        phase: this.options.mode,
        debugGraphics,
      })
      this.isRouting = false
      this.emitEvent({
        type: "complete",
        traces: fanoutTraces,
      })
    } catch (caughtError) {
      this.isRouting = false
      this.emitEvent({
        type: "error",
        error:
          caughtError instanceof Error
            ? caughtError
            : new Error(String(caughtError)),
      })
    }
  }

  start(): void {
    if (this.isRouting) return
    this.isRouting = true
    this.startTimeoutId = setTimeout(() => {
      this.startTimeoutId = undefined
      this.startFanout()
    }, 0) as unknown as number
  }

  stop(): void {
    if (this.startTimeoutId !== undefined) {
      clearTimeout(this.startTimeoutId)
      this.startTimeoutId = undefined
    }
    this.isRouting = false
  }

  on(
    event: "complete",
    callback: (event: AutorouterCompleteEvent) => void,
  ): void
  on(event: "error", callback: (event: AutorouterErrorEvent) => void): void
  on(
    event: "progress",
    callback: (event: AutorouterProgressEvent) => void,
  ): void
  on(
    event: "complete" | "error" | "progress",
    callback: (event: any) => void,
  ): void {
    if (event === "complete") {
      this.eventHandlers.complete.push(
        callback as (event: AutorouterCompleteEvent) => void,
      )
    } else if (event === "error") {
      this.eventHandlers.error.push(
        callback as (event: AutorouterErrorEvent) => void,
      )
    } else {
      this.eventHandlers.progress.push(
        callback as (event: AutorouterProgressEvent) => void,
      )
    }
  }

  private emitEvent(event: AutorouterEvent): void {
    if (event.type === "complete") {
      for (const handler of this.eventHandlers.complete) handler(event)
    } else if (event.type === "error") {
      for (const handler of this.eventHandlers.error) handler(event)
    } else {
      for (const handler of this.eventHandlers.progress) handler(event)
    }
  }

  solveSync(): SimplifiedPcbTrace[] {
    const { downstreamSimpleRouteJson, fanoutTraces } = this.solveFanout()
    this.outputSimpleRouteJson = downstreamSimpleRouteJson
    return fanoutTraces
  }

  getOutputSimpleRouteJson(): SimpleRouteJson | undefined {
    return this.outputSimpleRouteJson
  }
}
