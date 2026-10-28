import {
  TestPointSolver,
  type TestPointOptions,
  type TestPointRoutingInput,
} from "@tscircuit/test-point-rerouter"
import type {
  GenericLocalAutorouter,
  AutorouterEvent,
  AutorouterCompleteEvent,
  AutorouterErrorEvent,
  AutorouterProgressEvent,
} from "./GenericLocalAutorouter"
import type { SimpleRouteJson, SimplifiedPcbTrace } from "./SimpleRouteJson"
/** Preserves right-handed board-world points in mm, +X right, +Y up, +Z above.
 * Schedules target searches through the standard local autorouter lifecycle. */
export class TestPointAutorouter implements GenericLocalAutorouter {
  isRouting = false
  private requestCount: number
  private solver: TestPointSolver
  private cancelScheduledTick?: () => void
  private listeners: Array<{
    event: AutorouterEvent["type"]
    callback: (event: AutorouterEvent) => void
  }> = []
  constructor(
    public input: SimpleRouteJson,
    options: TestPointOptions,
  ) {
    this.requestCount = Math.max(1, options.requests.length)
    this.solver = new TestPointSolver(input as TestPointRoutingInput, options)
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
  start() {
    if (this.isRouting) return
    this.isRouting = true
    const tick = () => {
      if (!this.isRouting) return
      try {
        // Each solver step handles one target. Yield before searching the next target.
        this.solver.step()
        if (this.solver.failed) {
          this.isRouting = false
          this.emit({
            type: "error",
            error: new Error(this.solver.error ?? "Test point routing failed"),
          })
          return
        }
        if (this.solver.solved) {
          this.isRouting = false
          this.emit({
            type: "complete",
            traces: this.getOutputSimpleRouteJson().traces!,
          })
          return
        }
        this.emit({
          type: "progress",
          steps: this.solver.iterations,
          progress: Math.min(1, this.solver.iterations / this.requestCount),
          phase: "test_points",
          debugGraphics: this.solver.visualize(),
        })
        if (this.isRouting) this.scheduleTick(tick)
      } catch (error) {
        this.isRouting = false
        this.emit({
          type: "error",
          error: error instanceof Error ? error : new Error(String(error)),
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
      throw new Error(this.solver.error ?? "Test point routing failed")
    return this.getOutputSimpleRouteJson().traces!
  }
  getOutputSimpleRouteJson(): SimpleRouteJson {
    return this.solver.getOutput() as SimpleRouteJson
  }
  getTestPoints() {
    return this.solver.getOutput().testPoints
  }
}
