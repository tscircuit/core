import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import { corePromise, coreSync, originalCoreError } from "lib/effect/core-error"
import {
  AssignableAutoroutingPipeline2,
  AssignableAutoroutingPipeline3,
  AutoroutingPipeline1_OriginalUnravel,
  AutoroutingPipelineSolver,
  AutoroutingPipelineSolver3_HgPortPointPathing,
  AutoroutingPipelineSolver4,
  AutoroutingPipelineSolver5,
  AutoroutingPipelineSolver7_MultiGraph,
  AutoroutingPipelineSolver8,
  AutoroutingPipelineSolver9_PreloadedTraceGraph,
  AutoroutingPipelineSolver9_Networked,
  AutoroutingPipelineSolver11_Simplification,
  type CacheProvider,
} from "@tscircuit/capacity-autorouter"
import type { PlatformConfig } from "@tscircuit/props"
import { AutorouterError } from "lib/errors/AutorouterError"
import { SOLVERS, type SolverName } from "lib/solvers"
import type {
  AutorouterCompleteEvent,
  AutorouterErrorEvent,
  AutorouterEvent,
  AutorouterProgressEvent,
  GenericLocalAutorouter,
} from "./GenericLocalAutorouter"
import { getCacheProviderForLocalCacheEngine } from "./LocalCacheEngineCacheProvider"
import type { SimpleRouteJson, SimplifiedPcbTrace } from "./SimpleRouteJson"
import type { AutorouterVersion } from "./autorouter-version"

export interface SolverStartedDetails {
  solverName: SolverName
  solverParams: {
    input: SimpleRouteJson
    options: {
      capacityDepth?: number
      targetMinCapacity?: number
      cacheProvider: CacheProvider | null
      effort?: number
    }
  }
}

export interface AutorouterOptions {
  capacityDepth?: number
  targetMinCapacity?: number
  stepDelay?: number
  useAssignableSolver?: boolean
  useAutoJumperSolver?: boolean
  useLaserPrefabSolver?: boolean
  useTraceSimplificationSolver?: boolean
  autorouterVersion?: AutorouterVersion
  effort?: number
  platformConfig?: Pick<
    PlatformConfig,
    "localCacheEngine" | "useCloudAutorouter"
  >
  onSolverStarted?: (details: SolverStartedDetails) => void
}

export type AutorouterSolverName =
  | "AutoroutingPipelineSolver11_Simplification"
  | "AutoroutingPipeline1_OriginalUnravel"
  | "AutoroutingPipelineSolver3_HgPortPointPathing"
  | "AutoroutingPipelineSolver4"
  | "AutoroutingPipelineSolver5"
  | "AutoroutingPipelineSolver7_MultiGraph"
  | "AutoroutingPipelineSolver9_PreloadedTraceGraph"
  | "AutoroutingPipelineSolver9_Networked"
  | "AutoroutingPipelineSolver8"
  | "AssignableAutoroutingPipeline3"
  | "AssignableAutoroutingPipeline2"

export const getAutorouterSolverName = ({
  useAssignableSolver = false,
  useAutoJumperSolver = false,
  autorouterVersion,
  useLaserPrefabSolver = false,
  useTraceSimplificationSolver = false,
  platformConfig,
  effort,
}: Pick<
  AutorouterOptions,
  | "useAssignableSolver"
  | "useAutoJumperSolver"
  | "autorouterVersion"
  | "useLaserPrefabSolver"
  | "useTraceSimplificationSolver"
  | "platformConfig"
  | "effort"
>): AutorouterSolverName => {
  const pipeline9SolverName =
    platformConfig?.useCloudAutorouter && (effort === undefined || effort === 1)
      ? "AutoroutingPipelineSolver9_Networked"
      : "AutoroutingPipelineSolver9_PreloadedTraceGraph"

  if (useTraceSimplificationSolver) {
    return "AutoroutingPipelineSolver11_Simplification"
  }
  if (autorouterVersion === "beta_pipeline1") {
    return "AutoroutingPipeline1_OriginalUnravel"
  }
  if (autorouterVersion === "beta_pipeline3") {
    return "AutoroutingPipelineSolver3_HgPortPointPathing"
  }
  if (autorouterVersion === "beta_pipeline4") {
    return "AutoroutingPipelineSolver4"
  }
  if (autorouterVersion === "beta_pipeline5") {
    return "AutoroutingPipelineSolver5"
  }
  if (autorouterVersion === "beta_pipeline7") {
    return "AutoroutingPipelineSolver7_MultiGraph"
  }
  if (
    autorouterVersion === "beta_pipeline9" ||
    autorouterVersion === "latest"
  ) {
    return pipeline9SolverName
  }
  if (useLaserPrefabSolver) return "AutoroutingPipelineSolver8"
  if (useAutoJumperSolver) return "AssignableAutoroutingPipeline3"
  if (useAssignableSolver) return "AssignableAutoroutingPipeline2"
  return pipeline9SolverName
}

function getCapacityAutorouterCacheProvider(
  platformConfig?: Pick<PlatformConfig, "localCacheEngine">,
): CacheProvider | null {
  if (!platformConfig?.localCacheEngine) return null
  return getCacheProviderForLocalCacheEngine(platformConfig.localCacheEngine)
}

export class TscircuitAutorouter implements GenericLocalAutorouter {
  input: SimpleRouteJson
  isRouting = false
  private solver:
    | AutoroutingPipelineSolver
    | AssignableAutoroutingPipeline2
    | AssignableAutoroutingPipeline3
    | AutoroutingPipeline1_OriginalUnravel
    | AutoroutingPipelineSolver3_HgPortPointPathing
    | AutoroutingPipelineSolver4
    | AutoroutingPipelineSolver5
    | AutoroutingPipelineSolver7_MultiGraph
    | AutoroutingPipelineSolver8
    | AutoroutingPipelineSolver9_PreloadedTraceGraph
    | AutoroutingPipelineSolver11_Simplification
  private eventHandlers: {
    complete: Array<(ev: AutorouterCompleteEvent) => void>
    error: Array<(ev: AutorouterErrorEvent) => void>
    progress: Array<(ev: AutorouterProgressEvent) => void>
  } = {
    complete: [],
    error: [],
    progress: [],
  }
  private cycleCount = 0
  private stepDelay: number
  private interruptRouting?: () => void
  private routingGeneration = 0

  constructor(input: SimpleRouteJson, options: AutorouterOptions = {}) {
    this.input = input
    const {
      capacityDepth,
      targetMinCapacity,
      stepDelay = 0,
      useAssignableSolver = false,
      useAutoJumperSolver = false,
      autorouterVersion,
      useLaserPrefabSolver = false,
      useTraceSimplificationSolver = false,
      effort,
      platformConfig,
      onSolverStarted,
    } = options

    // Initialize the solver with input and optional configuration
    const solverName = getAutorouterSolverName({
      useAssignableSolver,
      useAutoJumperSolver,
      autorouterVersion,
      useLaserPrefabSolver,
      useTraceSimplificationSolver,
      platformConfig,
      effort,
    })
    const solverCacheProvider =
      getCapacityAutorouterCacheProvider(platformConfig)

    const solverOptions = {
      capacityDepth,
      targetMinCapacity,
      cacheProvider: solverCacheProvider,
      effort,
    }
    this.solver =
      solverName === "AutoroutingPipelineSolver9_Networked"
        ? new AutoroutingPipelineSolver9_Networked(input as any, {
            ...solverOptions,
            effort: 1,
          })
        : new SOLVERS[solverName](input as any, solverOptions)

    onSolverStarted?.({
      solverName,
      solverParams: {
        input,
        options: {
          capacityDepth,
          targetMinCapacity,
          cacheProvider: solverCacheProvider,
          effort,
        },
      },
    })

    this.stepDelay = stepDelay
  }

  /**
   * Start the autorouting process asynchronously
   * This will emit progress events during routing and a complete event when done
   */
  start(): void {
    if (this.isRouting) return
    this.isRouting = true
    this.cycleCount = 0
    const generation = ++this.routingGeneration
    const interrupt = Effect.runCallback(this.runRoutingEffect(), {
      onExit: (exit) => {
        if (generation !== this.routingGeneration) return
        this.interruptRouting = undefined
        if (Exit.isFailure(exit) && !Cause.hasInterrupts(exit.cause)) {
          const error = originalCoreError(exit.cause)
          try {
            this.emitEvent({
              type: "error",
              error:
                error instanceof AutorouterError
                  ? error
                  : new AutorouterError(
                      error instanceof Error ? error.message : String(error),
                    ),
            })
          } finally {
            if (generation === this.routingGeneration) this.isRouting = false
          }
        } else this.isRouting = false
      },
    })
    if (this.isRouting) this.interruptRouting = interrupt
  }

  /** External solver calls are adapters; native scheduling and sleeps belong
   * to this interruptible fiber. In-flight noncancellable solver steps can
   * finish, but cannot publish progress or schedule another cycle after stop. */
  private runRoutingEffect() {
    return Effect.gen({ self: this }, function* () {
      while (this.isRouting) {
        if (this.solver.failed) {
          return yield* Effect.fail(
            new AutorouterError(this.solver.error || "Routing failed"),
          )
        }
        if (this.solver.solved) {
          yield* coreSync(
            () =>
              this.emitEvent({
                type: "complete",
                traces:
                  this.solver.getOutputSimplifiedPcbTraces() as SimplifiedPcbTrace[],
              }),
            "complete_capacity_routing",
          )
          return
        }
        const startTime = Date.now()
        const startIterations = this.solver.iterations
        while (
          this.isRouting &&
          Date.now() - startTime < 250 &&
          !this.solver.failed &&
          !this.solver.solved
        ) {
          const activeSolver = this.solver
          if (
            "stepAsync" in activeSolver &&
            typeof activeSolver.stepAsync === "function"
          ) {
            const stepAsync = activeSolver.stepAsync
            yield* corePromise(
              () => stepAsync.call(activeSolver),
              "step_capacity_router",
            )
          } else {
            yield* coreSync(() => activeSolver.step(), "step_capacity_router")
          }
        }
        if (!this.isRouting) return
        const iterationsPerSecond =
          ((this.solver.iterations - startIterations) /
            (Date.now() - startTime)) *
          1000
        this.cycleCount++
        yield* coreSync(
          () =>
            this.emitEvent({
              type: "progress",
              steps: this.cycleCount,
              iterationsPerSecond,
              progress: this.solver.progress,
              phase:
                "getCurrentPhase" in this.solver
                  ? this.solver.getCurrentPhase()
                  : (this.solver.activeSubSolver?.getSolverName() ??
                    this.solver.getSolverName()),
              debugGraphics: this.solver.preview() || undefined,
            }),
          "capacity_routing_progress",
        )
        if (!this.isRouting) return
        yield* Effect.sleep(this.stepDelay)
      }
    })
  }

  stop(): void {
    this.isRouting = false
    this.routingGeneration++
    const interrupt = this.interruptRouting
    this.interruptRouting = undefined
    interrupt?.()
  }

  /**
   * Register an event handler
   */
  on(event: "complete", callback: (ev: AutorouterCompleteEvent) => void): void
  on(event: "error", callback: (ev: AutorouterErrorEvent) => void): void
  on(event: "progress", callback: (ev: AutorouterProgressEvent) => void): void
  on(
    event: "complete" | "error" | "progress",
    callback: (ev: any) => void,
  ): void {
    if (event === "complete") {
      this.eventHandlers.complete.push(
        callback as (ev: AutorouterCompleteEvent) => void,
      )
    } else if (event === "error") {
      this.eventHandlers.error.push(
        callback as (ev: AutorouterErrorEvent) => void,
      )
    } else if (event === "progress") {
      this.eventHandlers.progress.push(
        callback as (ev: AutorouterProgressEvent) => void,
      )
    }
  }

  /**
   * Emit an event to all registered handlers
   */
  removeListener(
    event: AutorouterEvent["type"],
    callback:
      | ((event: AutorouterCompleteEvent) => void)
      | ((event: AutorouterErrorEvent) => void)
      | ((event: AutorouterProgressEvent) => void),
  ): void {
    if (event === "complete") {
      this.eventHandlers.complete = this.eventHandlers.complete.filter(
        (handler) => handler !== callback,
      )
    } else if (event === "error") {
      this.eventHandlers.error = this.eventHandlers.error.filter(
        (handler) => handler !== callback,
      )
    } else {
      this.eventHandlers.progress = this.eventHandlers.progress.filter(
        (handler) => handler !== callback,
      )
    }
  }

  private emitEvent(event: AutorouterEvent): void {
    if (event.type === "complete") {
      for (const handler of this.eventHandlers.complete) {
        handler(event as AutorouterCompleteEvent)
      }
    } else if (event.type === "error") {
      for (const handler of this.eventHandlers.error) {
        handler(event as AutorouterErrorEvent)
      }
    } else if (event.type === "progress") {
      for (const handler of this.eventHandlers.progress) {
        handler(event as AutorouterProgressEvent)
      }
    }
  }

  /**
   * Solve the routing problem synchronously
   * @returns Array of routed traces
   */
  solveSync(): SimplifiedPcbTrace[] {
    this.solver.solve()

    if (this.solver.failed) {
      throw new AutorouterError(this.solver.error || "Routing failed")
    }

    return this.solver.getOutputSimplifiedPcbTraces() as SimplifiedPcbTrace[]
  }

  /**
   * Get the mapping of obstacle IDs to root connection names that were
   * connected via off-board paths (e.g., interconnects).
   * Only available when using AssignableAutoroutingPipeline2.
   */
  getConnectedOffboardObstacles(): Record<string, string> {
    if ("getConnectedOffboardObstacles" in this.solver) {
      return (
        this.solver as AssignableAutoroutingPipeline2
      ).getConnectedOffboardObstacles()
    }
    return {}
  }
}
