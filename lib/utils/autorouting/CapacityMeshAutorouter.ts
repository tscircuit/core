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
  platformConfig?: Pick<PlatformConfig, "localCacheEngine">
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
  | "AutoroutingPipelineSolver8"
  | "AssignableAutoroutingPipeline3"
  | "AssignableAutoroutingPipeline2"

export const getAutorouterSolverName = ({
  useAssignableSolver = false,
  useAutoJumperSolver = false,
  autorouterVersion,
  useLaserPrefabSolver = false,
  useTraceSimplificationSolver = false,
}: Pick<
  AutorouterOptions,
  | "useAssignableSolver"
  | "useAutoJumperSolver"
  | "autorouterVersion"
  | "useLaserPrefabSolver"
  | "useTraceSimplificationSolver"
>): AutorouterSolverName => {
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
    return "AutoroutingPipelineSolver9_PreloadedTraceGraph"
  }
  if (useLaserPrefabSolver) return "AutoroutingPipelineSolver8"
  if (useAutoJumperSolver) return "AssignableAutoroutingPipeline3"
  if (useAssignableSolver) return "AssignableAutoroutingPipeline2"
  return "AutoroutingPipelineSolver9_PreloadedTraceGraph"
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
  private stepCount = 0
  private runId = 0
  private cycleInProgress = false
  private stepDelay: number
  private timeoutId?: ReturnType<typeof setTimeout>

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
    })
    const SolverClass = SOLVERS[solverName]
    const solverCacheProvider =
      getCapacityAutorouterCacheProvider(platformConfig)

    this.solver = new SolverClass(input as any, {
      capacityDepth,
      targetMinCapacity,
      cacheProvider: solverCacheProvider,
      effort,
    })

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
    this.stepCount = 0
    this.runId++

    // A restarted run must wait for an outstanding asynchronous step to settle.
    if (!this.cycleInProgress) this.queueNextCycle(0)
  }

  private queueNextCycle(delay: number): void {
    const runId = this.runId
    this.timeoutId = setTimeout(() => {
      this.timeoutId = undefined
      void this.runCycleAndQueueNextCycle(runId)
    }, delay)
  }

  private async stepSolver(): Promise<void> {
    if (
      "stepAsync" in this.solver &&
      typeof this.solver.stepAsync === "function"
    ) {
      await this.solver.stepAsync()
      return
    }

    this.solver.step()
  }

  /**
   * Execute the next routing step and schedule the following one if needed
   */
  private async runCycleAndQueueNextCycle(runId: number): Promise<void> {
    if (!this.isRouting || runId !== this.runId) return

    this.cycleInProgress = true
    try {
      // If already solved or failed, complete the routing
      if (this.solver.solved || this.solver.failed) {
        const event: AutorouterCompleteEvent | AutorouterErrorEvent = this
          .solver.failed
          ? {
              type: "error",
              error: new AutorouterError(this.solver.error || "Routing failed"),
            }
          : {
              type: "complete",
              traces:
                this.solver.getOutputSimplifiedPcbTraces() as SimplifiedPcbTrace[],
            }
        this.isRouting = false
        this.emitEvent(event)
        return
      }

      // Yield between 250 ms slices. An individual step cannot be interrupted.
      const startTime = Date.now()
      const startIterations = this.solver.iterations
      while (
        Date.now() - startTime < 250 &&
        this.isRouting &&
        runId === this.runId &&
        !this.solver.failed &&
        !this.solver.solved
      ) {
        await this.stepSolver()
        if (!this.isRouting || runId !== this.runId) return
        this.stepCount++
      }
      if (!this.isRouting || runId !== this.runId) return

      const iterationsPerSecond =
        ((this.solver.iterations - startIterations) /
          Math.max(1, Date.now() - startTime)) *
        1000

      // Get visualization data if available
      const debugGraphics = this.solver?.preview() || undefined

      // Report progress
      const progress = this.solver.solved ? 1 : this.solver.progress

      this.emitEvent({
        type: "progress",
        steps: this.stepCount,
        iterationsPerSecond,
        progress,
        phase:
          "getCurrentPhase" in this.solver
            ? this.solver.getCurrentPhase()
            : (this.solver.activeSubSolver?.getSolverName() ??
              this.solver.getSolverName()),
        debugGraphics,
      })
    } catch (error) {
      if (runId !== this.runId) return

      // Handle any errors during the step
      this.isRouting = false
      this.emitEvent({
        type: "error",
        error:
          error instanceof Error
            ? new AutorouterError(error.message)
            : new AutorouterError(String(error)),
      })
    } finally {
      this.cycleInProgress = false
      // Progress and terminal listeners may stop or restart routing.
      if (this.isRouting) this.queueNextCycle(this.stepDelay)
    }
  }

  /**
   * Stop the routing process if it's in progress
   */
  stop(): void {
    this.isRouting = false
    this.runId++
    if (this.timeoutId !== undefined) {
      clearTimeout(this.timeoutId)
      this.timeoutId = undefined
    }
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
