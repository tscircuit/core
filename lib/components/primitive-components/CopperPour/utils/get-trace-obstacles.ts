import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { LayerRef } from "circuit-json"
import {
  generateApproximatingRects,
  type RotatedRect,
} from "lib/utils/obstacles/generateApproximatingRects"
import type { Obstacle } from "lib/utils/autorouting/SimpleRouteJson"

export const getTraceObstacles = (
  db: CircuitJsonUtilObjects,
  layer: LayerRef,
): Obstacle[] => {
  const traceObstacles: Obstacle[] = []
  for (const pcb_trace of db.pcb_trace.list()) {
    if (!pcb_trace.route) continue

    const source_trace = pcb_trace.source_trace_id
      ? db.source_trace.get(pcb_trace.source_trace_id)
      : null

    const connectedToIds = new Set<string>()
    if (pcb_trace.source_trace_id) {
      connectedToIds.add(pcb_trace.source_trace_id)
    }
    if (source_trace) {
      for (const id of source_trace.connected_source_net_ids)
        connectedToIds.add(id)
      for (const id of source_trace.connected_source_port_ids)
        connectedToIds.add(id)
    }

    for (const pt of pcb_trace.route) {
      if (pt.route_type === "wire") {
        if (pt.start_pcb_port_id) {
          const pcb_port = db.pcb_port.get(pt.start_pcb_port_id)
          if (pcb_port?.source_port_id)
            connectedToIds.add(pcb_port.source_port_id)
        }
        if (pt.end_pcb_port_id) {
          const pcb_port = db.pcb_port.get(pt.end_pcb_port_id)
          if (pcb_port?.source_port_id)
            connectedToIds.add(pcb_port.source_port_id)
        }
      }
    }

    const connectedTo = Array.from(connectedToIds)

    for (let i = 0; i < pcb_trace.route.length - 1; i++) {
      const p1 = pcb_trace.route[i]
      const p2 = pcb_trace.route[i + 1]

      if (p1.route_type !== "wire" || p2.route_type !== "wire") continue
      if (p1.layer !== layer) continue

      const segmentWidth = p1.width
      if (segmentWidth === 0) continue

      const segmentLength = Math.hypot(p1.x - p2.x, p1.y - p2.y)

      if (segmentLength === 0) continue

      const centerX = (p1.x + p2.x) / 2
      const centerY = (p1.y + p2.y) / 2
      const rotationDeg = (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI

      const rotatedRect: RotatedRect = {
        center: { x: centerX, y: centerY },
        width: segmentLength,
        height: segmentWidth,
        rotation: rotationDeg,
      }

      const approximatingRects = generateApproximatingRects(rotatedRect)

      for (const rect of approximatingRects) {
        traceObstacles.push({
          type: "rect",
          layers: [p1.layer] as LayerRef[],
          center: rect.center,
          width: rect.width,
          height: rect.height,
          connectedTo: connectedTo,
          obstacle_type: "trace",
        } as any)
      }
    }
  }
  return traceObstacles
}
