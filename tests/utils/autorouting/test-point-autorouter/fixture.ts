import { TestPointAutorouter } from "lib/utils/autorouting/TestPointAutorouter"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

export const createTestPointAutorouter = (blocked = false) => {
  const input: SimpleRouteJson = {
    layerCount: 2,
    minTraceWidth: 0.2,
    bounds: { minX: -5, maxX: 5, minY: -5, maxY: 5 },
    obstacles: blocked
      ? [
          {
            type: "rect",
            center: { x: 0, y: 0 },
            width: 10,
            height: 10,
            layers: ["top"],
            connectedTo: [],
          },
        ]
      : [],
    connections: [],
    traces: [-2, 2].map((y, index) => ({
      type: "pcb_trace",
      pcb_trace_id: `signal${index}`,
      connection_name: `signal${index}`,
      route: [-3, 3].map((x) => ({
        route_type: "wire",
        x,
        y,
        width: 0.2,
        layer: "top",
      })),
    })),
  }
  return new TestPointAutorouter(input, {
    requests: [0, 1].map((index) => ({
      name: `TP${index}`,
      pcbTraceId: `signal${index}`,
      layer: "top",
      diameter: 1,
    })),
    clearance: 0.2,
    minProbeSpacing: 2.54,
    maxDetour: 0,
  })
}
