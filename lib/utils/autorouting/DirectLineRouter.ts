import type { SimpleRouteJson } from "./SimpleRouteJson";
import type { SimplifiedPcbTrace } from "./SimpleRouteJson";

export class DirectLineRouter {
  input: SimpleRouteJson;

  constructor({ input }: { input: SimpleRouteJson }) {
    this.input = input;
  }

  solveAndMapToTraces(): SimplifiedPcbTrace[] {
    const traces: SimplifiedPcbTrace[] = [];

    for (const connection of this.input.connections) {
      if (connection.pointsToConnect.length !== 2) continue;
      const [start, end] = connection.pointsToConnect;

      // Ensure x and y are numbers
      const startX = Number(start.x);
      const startY = Number(start.y);
      const endX = Number(end.x);
      const endY = Number(end.y);

      const trace: SimplifiedPcbTrace = {
        type: "pcb_trace",
        pcb_trace_id: "",
        route: [
          {
            route_type: "wire",
            x: startX,
            y: startY,
            layer: "top",
            width: 0.1,
          },
          {
            route_type: "wire",
            x: endX,
            y: endY,
            layer: "top",
            width: 0.1,
          },
        ],
      };

      traces.push(trace);
    }

    return traces;
  }
}
