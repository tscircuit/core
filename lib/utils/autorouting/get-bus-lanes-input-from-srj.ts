import { normalizeBusLanesConnectionAliases } from "./normalize-bus-lanes-connection-aliases"
import type {
  SimpleRouteJson as BusLanesInput,
  Trace as BusLanesTrace,
} from "@tscircuit/bus-lanes-solver"
import type { SimpleRouteJson } from "./SimpleRouteJson"

/** Builds the bus solver's fixed-copper view in board-world millimetres
 * (+X right, +Y up). A through-obstacle passage already conducts between
 * layers through its supplied obstacle; it must not become a new drilled via.
 * Keep its planar projection on the entry layer and split at the layer change.
 * These fragments are input to the solver only, never replacement PCB traces.
 */
export function getBusLanesInputFromSrj(input: SimpleRouteJson): BusLanesInput {
  const boardLayers = Array.from({ length: input.layerCount }, (_, layer) =>
    layer === 0
      ? "top"
      : layer === input.layerCount - 1
        ? "bottom"
        : `inner${layer}`,
  )
  const traces: BusLanesTrace[] = []
  const occupiedTraceIds = new Set(
    input.traces?.map((trace) => trace.pcb_trace_id),
  )
  for (const trace of input.traces ?? []) {
    let route: BusLanesTrace["route"] = []
    let fragmentIndex = 0
    const flushFragment = (): void => {
      if (!route.length) return
      let pcbTraceId = trace.pcb_trace_id
      if (fragmentIndex > 0) {
        do {
          pcbTraceId = `${trace.pcb_trace_id}_bus_fragment_${fragmentIndex++}`
        } while (occupiedTraceIds.has(pcbTraceId))
      } else {
        fragmentIndex++
      }
      occupiedTraceIds.add(pcbTraceId)
      traces.push({ ...trace, pcb_trace_id: pcbTraceId, route })
      route = []
    }
    for (const segment of trace.route) {
      if (segment.route_type === "jumper") {
        throw new Error(
          "Bus lanes routing does not support supplied jumper copper",
        )
      }
      if (
        segment.route_type === "via" &&
        input.allowBlindAndBuriedVias === false
      ) {
        route.push({ ...segment, layers: segment.layers ?? boardLayers })
        continue
      }
      if (segment.route_type !== "through_obstacle") {
        route.push(segment)
        continue
      }
      route.push(
        {
          route_type: "wire",
          ...segment.start,
          layer: segment.from_layer,
          width: segment.width,
        },
        {
          route_type: "wire",
          ...segment.end,
          layer: segment.from_layer,
          width: segment.width,
        },
      )
      flushFragment()
      route.push({
        route_type: "wire",
        ...segment.end,
        layer: segment.to_layer,
        width: segment.width,
      })
    }
    flushFragment()
  }
  const normalized = normalizeBusLanesConnectionAliases({ ...input, traces })
  return {
    ...normalized,
    connections: normalized.connections.map((connection) => ({
      ...connection,
      pointsToConnect: connection.pointsToConnect.map((point) => {
        const via = normalized.traces
          ?.filter((trace) => trace.connection_name === connection.name)
          .flatMap((trace) => trace.route)
          .find(
            (routePoint) =>
              routePoint.route_type === "via" &&
              Math.hypot(routePoint.x - point.x, routePoint.y - point.y) < 1e-8,
          )
        if (!via || via.route_type !== "via") return point
        const span =
          via.layers ??
          boardLayers.slice(
            Math.min(
              boardLayers.indexOf(via.from_layer),
              boardLayers.indexOf(via.to_layer),
            ),
            Math.max(
              boardLayers.indexOf(via.from_layer),
              boardLayers.indexOf(via.to_layer),
            ) + 1,
          )
        if (!span.includes(point.layer)) return point
        const layers = span.filter((layer) =>
          (normalized.buses ?? []).every(
            (bus) =>
              !bus.connectionNames.includes(connection.name) ||
              !bus.allowedLayers ||
              bus.allowedLayers.includes(layer),
          ),
        )
        return layers.length > 1 ||
          layers.some((layer) => layer !== point.layer)
          ? { ...point, layers }
          : point
      }),
    })),
  } as BusLanesInput
}
