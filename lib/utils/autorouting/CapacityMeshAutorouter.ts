import type {
  AssignableViaAutoroutingPipelineSolver as AssignableViaAutoroutingPipelineSolverType,
  AutoroutingPipelineSolver as AutoroutingPipelineSolverType,
} from "@tscircuit/capacity-autorouter"
import * as CapacityAutorouter from "@tscircuit/capacity-autorouter"
import { AutorouterError } from "lib/errors/AutorouterError"
import type { SimpleRouteJson, SimplifiedPcbTrace } from "./SimpleRouteJson"
import type {
  AutorouterCompleteEvent,
  AutorouterErrorEvent,
  AutorouterProgressEvent,
  AutorouterEvent,
  GenericLocalAutorouter,
} from "./GenericLocalAutorouter"
import { SOLVERS } from "lib/solvers"

export interface CapacityMeshAutoRouterOptions {
  capacityDepth?: number
  targetMinCapacity?: number
  stepDelay?: number
  useAssignableViaSolver?: boolean
  onSolverStarted?: (details: {
    solverName: string
    solverParams: unknown
  }) => void
}

export class CapacityMeshAutorouter implements GenericLocalAutorouter {
  input: SimpleRouteJson
  isRouting = false
  private solver:
    | AutoroutingPipelineSolverType
    | AssignableViaAutoroutingPipelineSolverType
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

  constructor(
    input: SimpleRouteJson,
    options: CapacityMeshAutoRouterOptions = {},
  ) {
    this.input = input
    const {
      capacityDepth,
      targetMinCapacity,
      stepDelay = 0,
      useAssignableViaSolver = false,
      onSolverStarted,
    } = options

    // Initialize the solver with input and optional configuration
    const {
      AutoroutingPipelineSolver,
      AssignableViaAutoroutingPipelineSolver,
    } = CapacityAutorouter

    const solverName = useAssignableViaSolver
      ? "AssignableViaAutoroutingPipelineSolver"
      : "AutoroutingPipelineSolver"
    const SolverClass = SOLVERS[solverName]

    this.solver = new SolverClass(input as any, {
      capacityDepth,
      targetMinCapacity,
      cacheProvider: null,
    })

    onSolverStarted?.({
      solverName,
      solverParams: {
        input,
        options: {
          capacityDepth,
          targetMinCapacity,
          cacheProvider: null,
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

    // Start the routing process with steps
    this.runCycleAndQueueNextCycle()
  }

  /**
   * Execute the next routing step and schedule the following one if needed
   */
  private runCycleAndQueueNextCycle(): void {
    if (!this.isRouting) return

    try {
      // If already solved or failed, complete the routing
      if (this.solver.solved || this.solver.failed) {
        if (this.solver.failed) {
          this.emitEvent({
            type: "error",
            error: new AutorouterError(this.solver.error || "Routing failed"),
          })
        } else {
          this.emitEvent({
            type: "complete",
            traces: this.solver.getOutputSimpleRouteJson().traces || [],
          })
        }
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
        this.solver.step()
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

      this.emitEvent({
        type: "progress",
        steps: this.cycleCount,
        iterationsPerSecond,
        progress,
        phase: this.solver.getCurrentPhase(),
        debugGraphics,
      })

      // Schedule the next step
      if (this.stepDelay > 0) {
        this.timeoutId = setTimeout(
          () => this.runCycleAndQueueNextCycle(),
          this.stepDelay,
        ) as unknown as number
      } else {
        // Use setImmediate or setTimeout with 0 to prevent blocking the event loop
        this.timeoutId = setTimeout(
          () => this.runCycleAndQueueNextCycle(),
          0,
        ) as unknown as number
      }
    } catch (error) {
      // Handle any errors during the step
      this.emitEvent({
        type: "error",
        error:
          error instanceof Error
            ? new AutorouterError(error.message)
            : new AutorouterError(String(error)),
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

    return this.solver.getOutputSimpleRouteJson().traces || []
  }
}
