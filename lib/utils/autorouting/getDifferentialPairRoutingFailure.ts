import type { RoutingFailure } from "@tscircuit/capacity-autorouter"
import type { SimpleRouteJson, SimplifiedPcbTrace } from "./SimpleRouteJson"

/** Recheck exact owned-hop output, including cached/custom results. Positions are
 * circuit-world points in right-handed mm (+X right, +Y up, +Z above the board).
 * Only planar centerline distances contribute; via barrels contribute zero. */
export function getDifferentialPairRoutingFailure(
  input: SimpleRouteJson,
  traces: SimplifiedPcbTrace[],
): RoutingFailure | undefined {
  for (const [pairIndex, pair] of (input.differentialPairs ?? []).entries()) {
    const lengths = [0, 0]
    for (const [laneIndex, names] of pair.connectionNames.entries()) {
      for (const connectionName of names) {
        const routes = traces.filter(
          (trace) => trace.connection_name === connectionName,
        )
        if (!routes.length)
          return { reason: "missing_hop_route", pairIndex, connectionName }
        const connection = input.connections.find(
          (hop) => hop.name === connectionName,
        )!
        const route = routes[0]!
        const points = route.route
        const matches = (
          point: (typeof points)[number],
          terminal: (typeof connection.pointsToConnect)[number],
        ) =>
          point.route_type === "wire" &&
          Math.hypot(point.x - terminal.x, point.y - terminal.y) < 1e-8 &&
          (terminal.layers ?? [terminal.layer]).includes(point.layer)
        if (
          routes.length !== 1 ||
          route.source_trace_id !== connection.source_trace_id ||
          points.length < 2 ||
          connection.pointsToConnect.some(
            (terminal) =>
              !route.connectsTo?.includes(
                terminal.pointId ?? terminal.pcb_port_id!,
              ),
          ) ||
          !(
            (matches(points[0]!, connection.pointsToConnect[0]!) &&
              matches(points.at(-1)!, connection.pointsToConnect[1]!)) ||
            (matches(points[0]!, connection.pointsToConnect[1]!) &&
              matches(points.at(-1)!, connection.pointsToConnect[0]!))
          )
        )
          return { reason: "ownership_violation", pairIndex, connectionName }
        for (const [index, point] of points.entries()) {
          if (
            (point.route_type !== "wire" && point.route_type !== "via") ||
            !Number.isFinite(point.x) ||
            !Number.isFinite(point.y)
          )
            return { reason: "ownership_violation", pairIndex, connectionName }
          const previous = points[index - 1]
          if (
            previous &&
            (previous.route_type === "wire" || previous.route_type === "via")
          )
            lengths[laneIndex]! += Math.hypot(
              point.x - previous.x,
              point.y - previous.y,
            )
        }
      }
    }
    if (Math.abs(lengths[0]! - lengths[1]!) > pair.maxLengthSkewMm + 1e-9)
      return {
        reason: "length_skew",
        pairIndex,
        laneLengthsMm: [lengths[0]!, lengths[1]!],
      }
  }
}
