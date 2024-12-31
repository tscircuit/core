import type { PcbTrace } from "circuit-json"

/**
 * Computes the total length of a PCB trace by summing the lengths of all wire segments
 * and via connections
 * @param route The PCB trace route to measure
 * @returns Length in millimeters
 */
export function getTraceLength(route: PcbTrace["route"]): number {
  let totalLength = 0

  for (let i = 0; i < route.length; i++) {
    const point = route[i]

    if (point.route_type === "wire") {
      // For wire segments, compute straight-line distance
      const nextPoint = route[i + 1]
      if (nextPoint) {
        const dx = nextPoint.x - point.x
        const dy = nextPoint.y - point.y
        totalLength += Math.sqrt(dx * dx + dy * dy)
      }
    } else if (point.route_type === "via") {
      // Add via length (board thickness) - using 1.6mm as typical PCB thickness
      totalLength += 1.6
    }
  }

  return totalLength
}
