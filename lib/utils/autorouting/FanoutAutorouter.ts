import {
  FanoutSolver,
  type FanoutBorderTarget,
  type FanoutDirection,
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
import type { SimpleRouteJson, SimplifiedPcbTrace } from "./SimpleRouteJson"
import { getFanoutSharedBoundary } from "./get-fanout-shared-boundary"

export type FanoutAutorouterMode = "single_layer_fanout" | "fanout"

export interface FanoutAutorouterOptions {
  mode: FanoutAutorouterMode
  busFanoutDirections?: Readonly<Record<string, BusFanoutDirection>>
  fanoutBoundaryPadding?: FanoutBoundaryPadding
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
    if (!this.options.busFanoutDirections) return undefined
    const planeBusIds = new Set(
      this.input.buses
        ?.filter((bus) => bus.termination?.type === "plane")
        .map((bus) => bus.busId) ?? [],
    )
    const directions: Record<string, FanoutDirection> = {}
    for (const [busId, fanoutDirection] of Object.entries(
      this.options.busFanoutDirections,
    )) {
      if (!planeBusIds.has(busId)) continue
      const direction = getPlaneFanoutDirection(
        getNinePointAnchor(fanoutDirection),
      )
      if (direction) directions[busId] = direction
    }
    return Object.keys(directions).length > 0 ? directions : undefined
  }

  private getFanoutSolverOptions(): FanoutSolverOptions {
    const commonOptions: FanoutSolverOptions = {
      borderDistribution: "even",
      compactBusTracks: true,
      busDirections: this.getPlaneBusDirections(),
      busExitPreferences: this.getBusExitPreferences(),
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

  private solveFanout(): {
    downstreamSimpleRouteJson: SimpleRouteJson
    fanoutTraces: SimplifiedPcbTrace[]
    debugGraphics: AutorouterProgressEvent["debugGraphics"]
  } {
    const fanoutSolverOptions = this.getFanoutSolverOptions()
    let fanoutSolver = new FanoutSolver(
      this.input as unknown as ConstructorParameters<typeof FanoutSolver>[0],
      fanoutSolverOptions,
    )
    const sharedBoundary = getFanoutSharedBoundary({
      preparedBuses: fanoutSolver.preparedBuses,
      padding: this.options.fanoutBoundaryPadding,
    })
    if (sharedBoundary) {
      fanoutSolver = new FanoutSolver(
        this.input as unknown as ConstructorParameters<typeof FanoutSolver>[0],
        {
          ...fanoutSolverOptions,
          sharedBoundary,
        },
      )
    }
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
