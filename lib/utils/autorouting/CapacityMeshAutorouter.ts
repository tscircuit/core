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
  type RoutingFailure,
  getRoutingFailure,
} from "@tscircuit/capacity-autorouter"
import { getDifferentialPairRoutingFailure } from "./getDifferentialPairRoutingFailure"
import type { PlatformConfig } from "@tscircuit/props"
import { AutorouterError } from "lib/errors/AutorouterError"
import type { AutorouterComputeCostSummary } from "lib/events"
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
import {
  runThreadedAutorouter,
  type ThreadedAutoroutingRun,
} from "./run-threaded-autorouter"

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
    "localCacheEngine" | "useCloudAutorouter" | "autorouterThreads"
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
  routingFailure?: RoutingFailure
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
  private timeoutId?: number
  private autorouterThreads?: number
  private solverName: AutorouterSolverName
  private threadedRun?: ThreadedAutoroutingRun

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
    this.solverName = solverName
    this.autorouterThreads = platformConfig?.autorouterThreads
    if (
      this.autorouterThreads !== undefined &&
      (!Number.isSafeInteger(this.autorouterThreads) ||
        this.autorouterThreads < 1)
    ) {
      throw new AutorouterError("autorouterThreads must be a positive integer")
    }
    const solverCacheProvider =
      getCapacityAutorouterCacheProvider(platformConfig)

    const solverOptions = {
      capacityDepth,
      targetMinCapacity,
      cacheProvider: solverCacheProvider,
      effort,
    }
    if (
      input.differentialPairs?.length &&
      ![
        "AutoroutingPipelineSolver9_PreloadedTraceGraph",
        "AutoroutingPipelineSolver7_MultiGraph",
      ].includes(solverName)
    ) {
      throw new AutorouterError(
        "This autorouter does not support differential pairs",
        {
          reason: "unsupported_routing_scope",
          pairIndex: 0,
          detail: "Use the local Pipeline9 or Pipeline7 router",
        },
      )
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
    if (this.isRouting || this.threadedRun) return

    this.isRouting = true
    this.cycleCount = 0

    if (
      this.autorouterThreads !== undefined &&
      this.autorouterThreads > 1 &&
      this.solverName === "AutoroutingPipelineSolver9_PreloadedTraceGraph"
    ) {
      void this.runThreadedSolver(this.autorouterThreads)
      return
    }

    // Start the routing process with steps
    void this.runCycleAndQueueNextCycle()
  }

  private async runThreadedSolver(workerCount: number): Promise<void> {
    const run: ThreadedAutoroutingRun = { stopped: false }
    this.threadedRun = run
    try {
      // The selected name excludes networked Pipeline9 and legacy pipelines.
      const status = await runThreadedAutorouter(
        this.solver as AutoroutingPipelineSolver9_PreloadedTraceGraph,
        workerCount,
        run,
        (progress) => {
          this.cycleCount++
          const computeCostSummary = this.getComputeCostSummary()
          this.emitEvent({
            ...progress,
            steps: this.cycleCount,
            ...(computeCostSummary !== undefined ? { computeCostSummary } : {}),
          })
        },
      )
      if (run.stopped) return
      if (status === "inline") {
        // Browser hosts keep the existing stepped execution path.
        void this.runCycleAndQueueNextCycle()
        return
      }
      this.isRouting = false
      this.emitCompletion()
    } catch (error) {
      if (run.stopped) return
      this.isRouting = false
      this.emitEvent({
        type: "error",
        failure: (this.routingFailure = getRoutingFailure(error)),
        error:
          error instanceof Error ? error : new AutorouterError(String(error)),
      })
    } finally {
      this.threadedRun = undefined
    }
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
  private async runCycleAndQueueNextCycle(): Promise<void> {
    if (!this.isRouting) return

    try {
      // If already solved or failed, complete the routing
      if (this.solver.solved || this.solver.failed) {
        this.emitCompletion()
        this.isRouting = false
        return
      }

      // Execute one step of the solver
      // Execute for 10ms to allow the solver to make progress
      const startTime = Date.now()
      const startIterations = this.solver.iterations
      while (
        Date.now() - startTime < 250 &&
        !this.solver.failed &&
        !this.solver.solved
      ) {
        await this.stepSolver()
      }
      const iterationsPerSecond =
        ((this.solver.iterations - startIterations) /
          (Date.now() - startTime)) *
        1000
      this.cycleCount++

      // Get visualization data if available
      const debugGraphics = this.solver?.preview() || undefined

      // Report progress
      const progress = this.solver.progress
      const computeCostSummary = this.getComputeCostSummary()

      this.emitEvent({
        type: "progress",
        steps: this.cycleCount,
        iterationsPerSecond,
        progress,
        phase:
          "getCurrentPhase" in this.solver
            ? this.solver.getCurrentPhase()
            : (this.solver.activeSubSolver?.getSolverName() ??
              this.solver.getSolverName()),
        debugGraphics,
        ...(computeCostSummary !== undefined ? { computeCostSummary } : {}),
      })

      // Schedule the next step
      if (this.stepDelay > 0) {
        this.timeoutId = setTimeout(
          () => void this.runCycleAndQueueNextCycle(),
          this.stepDelay,
        ) as unknown as number
      } else {
        // Use setImmediate or setTimeout with 0 to prevent blocking the event loop
        this.timeoutId = setTimeout(
          () => void this.runCycleAndQueueNextCycle(),
          0,
        ) as unknown as number
      }
    } catch (error) {
      // Handle any errors during the step
      this.emitEvent({
        type: "error",
        failure: (this.routingFailure = getRoutingFailure(error)),
        error:
          error instanceof Error ? error : new AutorouterError(String(error)),
      })
      this.isRouting = false
    }
  }

  /**
   * Stop the routing process if it's in progress
   */
  stop(): void {
    if (!this.isRouting) return

    this.isRouting = false
    if (this.threadedRun) {
      const run = this.threadedRun
      run.stopped = true
      if (run.runtime) {
        run.disposal ??= run.runtime.dispose()
        // The pending solve awaits this same disposal; stop suppresses its events.
        void run.disposal.catch(() => {})
      }
    }
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
    if (this.isRouting || this.threadedRun) {
      throw new AutorouterError(
        "Cannot solve synchronously while autorouting is active",
      )
    }
    try {
      this.solver.solve()
      return this.getSolvedTraces()
    } catch (error) {
      this.routingFailure = getRoutingFailure(error)
      throw new AutorouterError(
        error instanceof Error ? error.message : String(error),
        this.routingFailure,
      )
    }
  }

  getComputeCostSummary(): AutorouterComputeCostSummary | undefined {
    return (
      this.solver as {
        getComputeCostSummary?(): AutorouterComputeCostSummary | undefined
      }
    ).getComputeCostSummary?.()
  }

  private getSolvedTraces(): SimplifiedPcbTrace[] {
    if ("getResult" in this.solver) {
      const result = this.solver.getResult()
      if (result.status === "failed") {
        this.routingFailure = result.failure
        throw new AutorouterError("Routing failed", result.failure)
      }
    } else if (this.solver.failed) {
      throw new AutorouterError(this.solver.error || "Routing failed")
    }
    const traces =
      this.solver.getOutputSimplifiedPcbTraces() as SimplifiedPcbTrace[]
    const failure = getDifferentialPairRoutingFailure(this.input, traces)
    if (failure)
      throw new AutorouterError("Differential pair routing failed", failure)
    return traces
  }

  private emitCompletion(): void {
    const traces = this.getSolvedTraces()
    this.emitEvent({ type: "complete", traces })
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
