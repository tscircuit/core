import {
  DogboneFanoutSolver,
  type DogboneFanoutSolverInput,
} from "./DogboneFanoutSolver"
import type { LocalAutorouterStrategyContext } from "./local-autorouter-strategies"
import type {
  GenericLocalAutorouter,
  AutorouterEvent,
  AutorouterCompleteEvent,
  AutorouterErrorEvent,
  AutorouterProgressEvent,
} from "./GenericLocalAutorouter"
import type { SimpleRouteJson, SimplifiedPcbTrace } from "./SimpleRouteJson"
/** Runs local dogbone steps asynchronously during PCB routing. Coordinates
 * are right-handed board-world points in mm (+X right, +Y up, +Z above). */
export class DogboneAutorouter implements GenericLocalAutorouter {
  get input() {
    return this.params.input
  }
  isRouting = false
  private solver: DogboneFanoutSolver
  private timer?: ReturnType<typeof setTimeout>
  private listeners: Array<{
    event: AutorouterEvent["type"]
    callback: (event: AutorouterEvent) => void
  }> = []
  constructor(
    public params: DogboneFanoutSolverInput,
    private callbacks: Pick<
      LocalAutorouterStrategyContext,
      "onSolverStarted" | "onSolverEnded"
    > = {},
  ) {
    this.solver = new DogboneFanoutSolver(params)
  }
  private finishSolver() {
    this.callbacks.onSolverEnded?.({
      solverName: "DogboneFanoutSolver",
      solved: this.solver.solved,
      failed: this.solver.failed,
      iterations: this.solver.iterations,
      error: this.solver.error,
    })
  }
  private getTraces(): SimplifiedPcbTrace[] {
    return this.solver.getOutput().map((trace) => {
      const connection = this.params.input.connections.find((connection) =>
        connection.pointsToConnect.some(
          (point) =>
            point.pcb_port_id && trace.connectsTo?.includes(point.pcb_port_id),
        ),
      )
      if (!connection)
        throw new Error("Dogbone fanout lost its source connection")
      return {
        ...trace,
        connection_name: connection.name,
        source_trace_id: connection.source_trace_id,
        connectsTo: [
          ...new Set([
            ...(trace.connectsTo ?? []),
            ...(connection.routingPcbGroupId
              ? connection.pointsToConnect.flatMap((point) =>
                  !point.pcb_port_id && point.pointId ? [point.pointId] : [],
                )
              : [`${trace.pcb_trace_id}_exit`]),
          ]),
        ],
      }
    })
  }
  getOutputSimpleRouteJson(): SimpleRouteJson {
    const traces = this.getTraces()
    return {
      ...this.params.input,
      traces,
      connections: this.params.input.connections.map((connection) => {
        const trace = traces.find(
          (trace) => trace.connection_name === connection.name,
        )
        if (!trace) return connection
        const exit = trace.route.at(-1)!
        if (exit.route_type !== "wire")
          throw new Error("Dogbone fanout lost its exit")
        return {
          ...connection,
          pointsToConnect: connection.pointsToConnect.map((point) => {
            const isHandoff = !point.pcb_port_id
            const relocate = connection.routingPcbGroupId
              ? isHandoff
              : Boolean(
                  point.pcb_port_id &&
                    trace.connectsTo?.includes(point.pcb_port_id),
                )
            if (!relocate) return point
            if (connection.routingPcbGroupId)
              return { ...point, x: exit.x, y: exit.y, layer: exit.layer }
            const { pcb_port_id: _port, ...handoff } = point
            return {
              ...handoff,
              pointId: `${trace.pcb_trace_id}_exit`,
              x: exit.x,
              y: exit.y,
              layer: exit.layer,
            }
          }),
        }
      }),
    }
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
    this.callbacks.onSolverStarted?.({
      solverName: "DogboneFanoutSolver",
      solverParams: this.params,
      solverConstructorArgs: this.solver.getConstructorParams(),
    })
    const tick = () => {
      if (!this.isRouting) return
      try {
        for (
          let i = 0;
          i < 16 && !this.solver.solved && !this.solver.failed;
          i++
        )
          this.solver.step()
        this.emit({
          type: "progress",
          steps: this.solver.iterations,
          progress: this.solver.progress,
          phase: this.solver.phase,
          debugGraphics: this.solver.visualize(),
        })
        if (!this.isRouting) return
        if (this.solver.failed) {
          this.finishSolver()
          this.isRouting = false
          this.emit({
            type: "error",
            error: new Error(this.solver.error ?? "Dogbone routing failed"),
          })
          return
        }
        if (this.solver.solved) {
          this.finishSolver()
          this.isRouting = false
          this.emit({ type: "complete", traces: this.getTraces() })
          return
        }
        this.timer = setTimeout(tick, 0)
      } catch (error) {
        this.isRouting = false
        this.emit({
          type: "error",
          error: error instanceof Error ? error : new Error(String(error)),
        })
      }
    }
    this.timer = setTimeout(tick, 0)
  }
  stop() {
    this.isRouting = false
    if (this.timer) clearTimeout(this.timer)
  }
  solveSync(): SimplifiedPcbTrace[] {
    this.solver.solve()
    if (this.solver.failed)
      throw new Error(this.solver.error ?? "Dogbone routing failed")
    return this.getTraces()
  }
}
