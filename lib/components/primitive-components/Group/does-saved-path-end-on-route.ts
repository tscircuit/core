import { pointToSegmentDistance } from "@tscircuit/math-utils"
import type { SimplifiedPcbTrace } from "lib/utils/autorouting/SimpleRouteJson"

/**
 * Test a junction in board-world mm (+X right, +Y up, +Z above). Only
 * same-layer wire centerlines count; an XY crossing on another layer cannot
 * complete a saved path. Callers restrict routes to the same SRJ connection.
 */
export function doesSavedPathEndOnRoute(
  endpoint: { x: number; y: number; layer: string },
  route: SimplifiedPcbTrace["route"],
): boolean {
  return route.some((point, index) => {
    const next = route[index + 1]
    if (
      point.route_type !== "wire" ||
      next?.route_type !== "wire" ||
      point.layer !== endpoint.layer ||
      next.layer !== endpoint.layer
    )
      return false
    return pointToSegmentDistance(endpoint, point, next) < 1e-4
  })
}
