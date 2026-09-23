import type { Point, PcbTraceRoutePoint } from "circuit-json"

export const getRoutePointPosition = (point: PcbTraceRoutePoint): Point => {
  if (point.route_type === "through_pad" || point.route_type === "teardrop")
    return point.start
  return { x: point.x, y: point.y }
}

export const getRoutePointPositions = (point: PcbTraceRoutePoint): Point[] => {
  if (point.route_type === "through_pad" || point.route_type === "teardrop")
    return [point.start, point.end]
  return [{ x: point.x, y: point.y }]
}
