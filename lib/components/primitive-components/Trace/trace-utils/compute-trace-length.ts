import type { PcbTrace } from "circuit-json"
import { getRoutePointPositions } from "lib/utils/pcb-trace-route-point-utils"

/**
 * Computes the total length of a PCB trace by summing the lengths of all wire segments
 * and via connections
 * @param route The PCB trace route to measure
 * @returns Length in millimeters
 */
export function getTraceLength(route: PcbTrace["route"]): number {
  const routePositions = route.flatMap(getRoutePointPositions)
  let totalLength =
    route.filter(({ route_type }) => route_type === "via").length * 1.6

  for (let i = 1; i < routePositions.length; i++) {
    const previousPosition = routePositions[i - 1]
    const position = routePositions[i]
    totalLength += Math.hypot(
      position.x - previousPosition.x,
      position.y - previousPosition.y,
    )
  }

  return totalLength
}
