import type { PcbTrace } from "circuit-json"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"

export const createWideTraceObstacle = (vertical = false, width = 0.5) => {
  const trace: PcbTrace = {
    type: "pcb_trace",
    pcb_trace_id: "pcb_trace_wide",
    source_trace_id: "source_trace_wide",
    route: [
      { route_type: "wire", x: 0, y: 0, width, layer: "top" },
      {
        route_type: "wire",
        x: vertical ? 0 : 10,
        y: vertical ? 10 : 0,
        width,
        layer: "top",
      },
    ],
  }
  return { trace, obstacles: getObstaclesFromCircuitJson([trace]) }
}
