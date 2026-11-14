import {
  BusLanesPipelineSolver,
  type BusLanesPipelineOptions,
  type SimpleRouteJson as BusLanesInput,
} from "@tscircuit/bus-lanes-solver"
import type {
  GenericLocalAutorouter,
  AutorouterEvent,
  AutorouterCompleteEvent,
  AutorouterErrorEvent,
  AutorouterProgressEvent,
} from "./GenericLocalAutorouter"
import type { SimpleRouteJson, SimplifiedPcbTrace } from "./SimpleRouteJson"
/** Adapter preserves board coordinates (mm, +X right, +Y up). A failed planar
 * solve emits an error; it never falls back to a router that can insert vias. */
export class BusLanesAutorouter implements GenericLocalAutorouter {
  isRouting = false
  private solver: BusLanesPipelineSolver
  private readonly connectivityOnly: boolean
  private cancelScheduledTick?: () => void
  private listeners: Array<{
    event: AutorouterEvent["type"]
    callback: (event: AutorouterEvent) => void
  }> = []
  constructor(
    public input: SimpleRouteJson,
    options: BusLanesPipelineOptions = {},
  ) {
    this.connectivityOnly = options.goal === "connectivity"
    // The solver validates unsupported SRJ route primitives at its input boundary.
    let busLanesInput = input as unknown as BusLanesInput
    if (this.connectivityOnly) {
      const layerConstraints = [
        busLanesInput.allowedLayers,
        ...(input.buses?.map((bus) => bus.allowedLayers) ?? []),
      ].filter((layers) => layers !== undefined)
      const carrierLayers = layerConstraints
        .reduce(
          (layers, constraint) =>
            layers.filter((layer) => constraint.includes(layer)),
          layerConstraints[0] ?? [],
        )
        .filter((layer) => layer !== "top")
      if (carrierLayers.length !== 1) {
        throw new Error(
          "Connectivity routing requires one shared non-top carrier; set pcbAllowedLayers on the bus",
        )
      }
      busLanesInput = { ...busLanesInput, allowedLayers: carrierLayers }
    }
    this.solver = new BusLanesPipelineSolver(busLanesInput, options)
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
  private routingError(cause: unknown): Error {
    if (this.connectivityOnly) {
      // Dependency diagnostics may contain SRJ identifiers. Keep those in the
      // structured cause and give core a readable user-facing message.
      return new Error(
        "Bus lanes connectivity routing could not connect all requested signals",
        { cause },
      )
    }
    return cause instanceof Error ? cause : new Error(String(cause))
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
          this.emit({
            type: "error",
            error: this.routingError(
              this.solver.error ?? "Bus lanes routing failed",
            ),
          })
          return
        }
        if (this.solver.solved) {
          this.isRouting = false
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
        this.emit({
          type: "error",
          error: this.routingError(error),
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
    this.solver.solve()
    if (this.solver.failed)
      throw this.routingError(this.solver.error ?? "Bus lanes routing failed")
    return this.solver.traces
  }
}
