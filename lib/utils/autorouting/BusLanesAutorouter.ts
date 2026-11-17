import { BusLanesPipelineSolver } from "@tscircuit/bus-lanes-solver"
import { getBusLanesInputFromSrj } from "./get-bus-lanes-input-from-srj"
import type {
  GenericLocalAutorouter,
  AutorouterEvent,
  AutorouterCompleteEvent,
  AutorouterErrorEvent,
  AutorouterProgressEvent,
} from "./GenericLocalAutorouter"
import type { SimpleRouteJson, SimplifiedPcbTrace } from "./SimpleRouteJson"
import type { SolverEndedEvent } from "lib/events"

export interface BusLanesSolverStarted {
  solverName: "BusLanesPipelineSolver"
  solverParams: BusLanesPipelineSolver["input"]
  solverConstructorArgs: ReturnType<
    BusLanesPipelineSolver["getConstructorParams"]
  >
}

export interface BusLanesSolverEnded
  extends Omit<SolverEndedEvent, "type" | "componentName"> {
  solverName: "BusLanesPipelineSolver"
}

export interface BusLanesAutorouterOptions {
  onSolverStarted?: (details: BusLanesSolverStarted) => void
  onSolverEnded?: (event: BusLanesSolverEnded) => void
}

/** Adapter preserves board coordinates (mm, +X right, +Y up). A failed planar
 * solve emits an error; it never falls back to a router that can insert vias. */
export class BusLanesAutorouter implements GenericLocalAutorouter {
  isRouting = false
  private solver: BusLanesPipelineSolver
  private solverEndedReported = false
  private cancelScheduledTick?: () => void
  private listeners: Array<{
    event: AutorouterEvent["type"]
    callback: (event: AutorouterEvent) => void
  }> = []
  constructor(
    public input: SimpleRouteJson,
    private readonly options: BusLanesAutorouterOptions = {},
  ) {
    this.solver = new BusLanesPipelineSolver(getBusLanesInputFromSrj(input))
    // Observe the constructed solver's physical input, including fixed-copper
    // adaptation and future terminal intent, rather than the pre-adapter SRJ.
    options.onSolverStarted?.({
      solverName: "BusLanesPipelineSolver",
      solverParams: this.solver.input,
      solverConstructorArgs: this.solver.getConstructorParams(),
    })
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
    event: AutorouterEvent["type"],
    callback:
      | ((event: AutorouterCompleteEvent) => void)
      | ((event: AutorouterErrorEvent) => void)
      | ((event: AutorouterProgressEvent) => void),
  ) {
    this.listeners.push({
      event,
      callback: callback as (event: AutorouterEvent) => void,
    })
  }
  private emit(event: AutorouterEvent) {
    for (const listener of this.listeners)
      if (listener.event === event.type) listener.callback(event)
  }
  private reportSolverEnded(error?: Error): void {
    if (this.solverEndedReported) return
    this.solverEndedReported = true
    if (!this.options.onSolverEnded) return
    const pendingRoutingAccessReport =
      this.solver.getPendingRoutingAccessReport()
    this.options.onSolverEnded({
      solverName: "BusLanesPipelineSolver",
      solved: this.solver.solved && !error,
      failed: this.solver.failed || error !== undefined,
      iterations: this.solver.iterations,
      error: error?.message ?? this.solver.error,
      ...(pendingRoutingAccessReport ? { pendingRoutingAccessReport } : {}),
    })
  }
  start() {
    if (this.isRouting) return
    this.isRouting = true
    const tick = () => {
      if (!this.isRouting) return
      try {
        for (
          let i = 0;
          i < 200 && !this.solver.solved && !this.solver.failed;
          i++
        )
          this.solver.step()
        if (this.solver.failed) {
          this.isRouting = false
          this.reportSolverEnded()
          this.emit({
            type: "error",
            error: new Error(this.solver.error ?? "Bus lanes routing failed"),
          })
          return
        }
        if (this.solver.solved) {
          this.isRouting = false
          this.reportSolverEnded()
          this.emit({ type: "complete", traces: this.solver.traces })
          return
        }
        this.emit({
          type: "progress",
          steps: this.solver.iterations,
          progress: this.solver.progress,
          phase: this.solver.phase,
          debugGraphics: this.solver.visualize(),
        })
        this.scheduleTick(tick)
      } catch (error) {
        this.isRouting = false
        const routingError =
          error instanceof Error ? error : new Error(String(error))
        this.reportSolverEnded(routingError)
        this.emit({
          type: "error",
          error: routingError,
        })
      }
    }
    this.scheduleTick(tick)
  }
  private scheduleTick(tick: () => void) {
    // Node/Bun can yield to I/O without imposing the timer's minimum delay.
    // Browsers retain their normal task scheduling and cancellation behavior.
    if (typeof globalThis.setImmediate === "function") {
      const timer = globalThis.setImmediate(tick)
      this.cancelScheduledTick = () => globalThis.clearImmediate(timer)
    } else {
      const timer = setTimeout(tick, 0)
      this.cancelScheduledTick = () => clearTimeout(timer)
    }
  }
  stop() {
    this.isRouting = false
    this.cancelScheduledTick?.()
  }
  solveSync(): SimplifiedPcbTrace[] {
    try {
      this.solver.solve()
      if (this.solver.failed)
        throw new Error(this.solver.error ?? "Bus lanes routing failed")
    } catch (error) {
      const routingError =
        error instanceof Error ? error : new Error(String(error))
      this.reportSolverEnded(routingError)
      throw routingError
    }
    this.reportSolverEnded()
    return this.solver.traces
  }
}
