import type { LayerRef, PcbTraceRoutePoint } from "circuit-json"

export type ManualPcbPathPoint = {
  x: number
  y: number
  via?: boolean
  fromLayer?: LayerRef
  toLayer?: LayerRef
}

/**
 * Convert a pcb_trace route to pcbPath format.
 * The first and last points are excluded since the Trace component
 * will automatically add those based on port positions.
 */
export function pcbTraceRouteToPcbPath(
  route: PcbTraceRoutePoint[],
): ManualPcbPathPoint[] {
  if (route.length <= 2) {
    return []
  }

  return route.slice(1, -1).map((point) => {
    if (point.route_type === "via") {
      return {
        x: point.x,
        y: point.y,
        via: true,
        fromLayer: point.from_layer as LayerRef,
        toLayer: point.to_layer as LayerRef,
      }
    }
    return { x: point.x, y: point.y }
  })
}
