import type { LayerRef, PcbTrace } from "circuit-json"
import type { CircuitJsonMetadata } from "./SimpleRouteJson"

export type PcbTraceRoutePointWithSrjMetadata = PcbTrace["route"][number] & {
  circuitJsonMetadata?: CircuitJsonMetadata
  /** Simple Route JSON hint for the physical via barrel span. */
  layers?: readonly LayerRef[]
}

/**
 * Removes routing-only metadata before a Simple Route JSON route is persisted
 * as Circuit JSON. The original route remains available for via inflation.
 */
export const getCircuitJsonPcbTraceRoute = (
  route: readonly PcbTraceRoutePointWithSrjMetadata[],
): PcbTrace["route"] =>
  route.map((routePoint) => {
    const {
      circuitJsonMetadata: _circuitJsonMetadata,
      ...routePointWithoutMetadata
    } = routePoint

    if (routePointWithoutMetadata.route_type !== "via") {
      return routePointWithoutMetadata as PcbTrace["route"][number]
    }

    const { layers: _layers, ...circuitJsonRoutePoint } =
      routePointWithoutMetadata
    return circuitJsonRoutePoint as PcbTrace["route"][number]
  })
