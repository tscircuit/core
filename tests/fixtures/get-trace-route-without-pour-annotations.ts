import type { PcbTraceRoutePoint } from "circuit-json"

/** Remove only derived visibility flags, preserving every physical route field. */
export const getTraceRouteWithoutPourAnnotations = (
  route: PcbTraceRoutePoint[],
) =>
  route.map((point) => {
    if (point.route_type !== "wire" && point.route_type !== "via") return point
    const { is_inside_copper_pour, copper_pour_id, ...geometry } = point
    return geometry
  })
