import type {
  PcbTraceRoutePoint,
  PcbTraceRoutePointTeardrop,
} from "circuit-json"

/** Reject tapered copper until core's geometry consumers support its full profile. */
export function assertSupportedPcbTraceRoutePoint(
  point: PcbTraceRoutePoint,
): asserts point is Exclude<PcbTraceRoutePoint, PcbTraceRoutePointTeardrop> {
  if (point.route_type === "teardrop") {
    throw new Error("Teardrop PCB trace routes are not yet supported by core")
  }
}
