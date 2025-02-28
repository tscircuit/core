import type { SimpleRouteJson } from "./SimpleRouteJson"
import type { SimplifiedPcbTrace } from "./SimpleRouteJson"

export class DirectLineRouter {
  input: SimpleRouteJson

  constructor({ input }: { input: SimpleRouteJson }) {
    this.input = input
  }

  solveAndMapToTraces(): SimplifiedPcbTrace[] {
    const traces: SimplifiedPcbTrace[] = []

    for (const connection of this.input.connections) {
      if (connection.pointsToConnect.length !== 2) continue
      const [start, end] = connection.pointsToConnect
      const trace: SimplifiedPcbTrace = {
        type: "pcb_trace",
        pcb_trace_id: "",
        connection_name: connection.name,
        route: [
          {
            route_type: "wire",
            x: start.x,
            y: start.y,
            layer: "top",
            width: 0.1,
          },
          {
            route_type: "wire",
            x: end.x,
            y: end.y,
            layer: "top",
            width: 0.1,
          },
        ],
      }
      traces.push(trace)
    }

    return traces
  }
}
