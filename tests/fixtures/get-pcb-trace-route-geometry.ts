import type { PcbTrace } from "circuit-json"
import type { SimplifiedPcbTrace } from "lib/utils/autorouting/SimpleRouteJson"

/**
 * Compare emitted board-world points in mm (+X right, +Y up, +Z above,
 * right-handed), excluding wire endpoint port IDs added by Circuit JSON.
 */
export function getPcbTraceRouteGeometry(
  trace: Pick<PcbTrace | SimplifiedPcbTrace, "route">,
) {
  return trace.route.map((point) => {
    if (point.route_type !== "wire") return point
    const { route_type, x, y, width, layer } = point
    return { route_type, x, y, width, layer }
  })
}
