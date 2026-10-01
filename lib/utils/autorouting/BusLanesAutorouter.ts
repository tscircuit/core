import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import { coreSync, originalCoreError } from "lib/effect/core-error"
import {
  BusLanesPipelineSolver,
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
  private interruptRouting?: () => void
  private routingGeneration = 0
  private listeners: Array<{
    event: AutorouterEvent["type"]
    callback: (event: AutorouterEvent) => void
  }> = []
  constructor(public input: SimpleRouteJson) {
    // The solver validates unsupported SRJ route primitives at its input boundary.
    this.solver = new BusLanesPipelineSolver(input as unknown as BusLanesInput)
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
  removeListener(
    event: AutorouterEvent["type"],
    callback:
      | ((event: AutorouterCompleteEvent) => void)
      | ((event: AutorouterErrorEvent) => void)
      | ((event: AutorouterProgressEvent) => void),
  ): void {
    this.listeners = this.listeners.filter(
      (listener) => listener.event !== event || listener.callback !== callback,
    )
  }
  private emit(event: AutorouterEvent) {
    for (const listener of this.listeners)
      if (listener.event === event.type) listener.callback(event)
  }
  start() {
    if (this.isRouting) return
    this.isRouting = true
    const generation = ++this.routingGeneration
    const interrupt = Effect.runCallback(this.runRoutingEffect(), {
      onExit: (exit) => {
        if (generation !== this.routingGeneration) return
        this.isRouting = false
        this.interruptRouting = undefined
        if (Exit.isFailure(exit) && !Cause.hasInterrupts(exit.cause)) {
          const error = originalCoreError(exit.cause)
          this.emit({
            type: "error",
            error: error instanceof Error ? error : new Error(String(error)),
          })
        }
      },
    })
    if (this.isRouting) this.interruptRouting = interrupt
  }

  private runRoutingEffect() {
    return Effect.gen({ self: this }, function* () {
      yield* Effect.sleep(0)
      while (this.isRouting) {
        yield* coreSync(() => {
          for (
            let iteration = 0;
            iteration < 200 && !this.solver.solved && !this.solver.failed;
            iteration++
          )
            this.solver.step()
        }, "step_bus_lanes_router")
        if (!this.isRouting) return
        if (this.solver.failed)
          return yield* Effect.fail(
            new Error(this.solver.error ?? "Bus lanes routing failed"),
          )
        if (this.solver.solved) {
          yield* coreSync(() => {
            this.isRouting = false
            this.emit({ type: "complete", traces: this.solver.traces })
          }, "complete_bus_lanes_routing")
          return
        }
        yield* coreSync(
          () =>
            this.emit({
              type: "progress",
              steps: this.solver.iterations,
              progress: this.solver.progress,
              phase: this.solver.phase,
              debugGraphics: this.solver.visualize(),
            }),
          "bus_lanes_routing_progress",
        )
        if (!this.isRouting) return
        yield* Effect.sleep(0)
      }
    })
  }

  stop() {
    this.isRouting = false
    this.routingGeneration++
    const interrupt = this.interruptRouting
    this.interruptRouting = undefined
    interrupt?.()
  }
  solveSync(): SimplifiedPcbTrace[] {
    this.solver.solve()
    if (this.solver.failed)
      throw new Error(this.solver.error ?? "Bus lanes routing failed")
    return this.solver.traces
  }
}
