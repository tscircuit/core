import type { PcbTraceRoutePoint } from "circuit-json"

/**
 * Bounds of Circuit JSON route points in the footprint-local PCB frame:
 * right-handed, +X right, +Y top, +Z above, in mm. Points include translation;
 * widths are distances. The returned bounds stay in this local frame.
 */
export const getPcbTraceRouteBounds = (
  route: PcbTraceRoutePoint[],
): { left: number; right: number; top: number; bottom: number } => {
  if (!route || route.length === 0) {
    return { left: 0, right: 0, top: 0, bottom: 0 }
  }

  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  for (const point of route) {
    if (point.route_type === "through_pad") {
      minX = Math.min(minX, point.start.x, point.end.x)
      maxX = Math.max(maxX, point.start.x, point.end.x)
      minY = Math.min(minY, point.start.y, point.end.y)
      maxY = Math.max(maxY, point.start.y, point.end.y)
    } else {
      minX = Math.min(minX, point.x)
      maxX = Math.max(maxX, point.x)
      minY = Math.min(minY, point.y)
      maxY = Math.max(maxY, point.y)
    }

    if (point.route_type === "wire") {
      minX = Math.min(minX, point.x - point.width / 2)
      maxX = Math.max(maxX, point.x + point.width / 2)
      minY = Math.min(minY, point.y - point.width / 2)
      maxY = Math.max(maxY, point.y + point.width / 2)
    } else if (point.route_type === "through_pad") {
      minX = Math.min(
        minX,
        point.start.x - point.width / 2,
        point.end.x - point.width / 2,
      )
      maxX = Math.max(
        maxX,
        point.start.x + point.width / 2,
        point.end.x + point.width / 2,
      )
      minY = Math.min(
        minY,
        point.start.y - point.width / 2,
        point.end.y - point.width / 2,
      )
      maxY = Math.max(
        maxY,
        point.start.y + point.width / 2,
        point.end.y + point.width / 2,
      )
    }
  }

  if (
    minX === Infinity ||
    maxX === -Infinity ||
    minY === Infinity ||
    maxY === -Infinity
  ) {
    return { left: 0, right: 0, top: 0, bottom: 0 }
  }

  return {
    left: minX,
    right: maxX,
    top: maxY,
    bottom: minY,
  }
}
