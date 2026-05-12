import type { LayerRef, PcbTraceRoutePoint } from "circuit-json"
import { getRoutePointPosition } from "./pcb-trace-route-point-utils"

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
 * Also filters out any intermediate points that duplicate the start/end positions.
 */
export function pcbTraceRouteToPcbPath(
  route: PcbTraceRoutePoint[],
): ManualPcbPathPoint[] {
  if (route.length <= 2) {
    return []
  }

  const firstPoint = route[0]
  const lastPoint = route[route.length - 1]

  return route
    .slice(1, -1)
    .filter((point) => {
      // Filter out points that duplicate the start or end position
      const position = getRoutePointPosition(point)
      const firstPosition = getRoutePointPosition(firstPoint)
      const lastPosition = getRoutePointPosition(lastPoint)
      const isSameAsFirst =
        position.x === firstPosition.x && position.y === firstPosition.y
      const isSameAsLast =
        position.x === lastPosition.x && position.y === lastPosition.y
      return !isSameAsFirst && !isSameAsLast
    })
    .map((point) => {
      if (point.route_type === "via") {
        return {
          x: point.x,
          y: point.y,
          via: true,
          fromLayer: point.from_layer as LayerRef,
          toLayer: point.to_layer as LayerRef,
        }
      }
      const position = getRoutePointPosition(point)
      return { x: position.x, y: position.y }
    })
}
