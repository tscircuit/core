import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { LayerRef, PcbTrace } from "circuit-json"
import type { SimplifiedPcbTrace } from "./SimpleRouteJson"

type PreservedTrace = PcbTrace & {
  connection_name?: string
  connectsTo?: string[]
}

type PreservedViaRoutePoint = Extract<
  PcbTrace["route"][number],
  { route_type: "via" }
> & {
  via_diameter?: number
  via_hole_diameter?: number
}

const getLayerName = (layer: LayerRef | { name: string }): string =>
  typeof layer === "string" ? layer : layer.name

const getPreservedTraceConnectionName = (trace: PreservedTrace) =>
  trace.source_trace_id ?? trace.connection_name ?? trace.pcb_trace_id

const getPhysicalConnectionIdsForPreservedTrace = (trace: PreservedTrace) => {
  const physicallyConnectedIds = new Set(trace.connectsTo ?? [])
  for (const routePoint of trace.route) {
    if (routePoint.route_type !== "wire") continue
    for (const pcbPortId of [
      routePoint.start_pcb_port_id,
      routePoint.end_pcb_port_id,
    ]) {
      if (pcbPortId) physicallyConnectedIds.add(pcbPortId)
    }
  }

  return Array.from(physicallyConnectedIds)
}

const getSimpleRouteForPreservedTrace = (
  trace: PreservedTrace,
): SimplifiedPcbTrace["route"] =>
  trace.route.map((routePoint) => {
    if (routePoint.route_type === "wire") {
      return {
        route_type: "wire",
        x: routePoint.x,
        y: routePoint.y,
        width: routePoint.width,
        layer: getLayerName(routePoint.layer),
      }
    }

    if (routePoint.route_type === "via") {
      const preservedViaRoutePoint = routePoint as PreservedViaRoutePoint
      const viaDiameter =
        preservedViaRoutePoint.outer_diameter ??
        preservedViaRoutePoint.via_diameter
      const viaHoleDiameter =
        preservedViaRoutePoint.hole_diameter ??
        preservedViaRoutePoint.via_hole_diameter
      return {
        route_type: "via",
        x: routePoint.x,
        y: routePoint.y,
        from_layer: getLayerName(routePoint.from_layer),
        to_layer: getLayerName(routePoint.to_layer),
        ...(viaDiameter !== undefined ? { via_diameter: viaDiameter } : {}),
        ...(viaHoleDiameter !== undefined
          ? { via_hole_diameter: viaHoleDiameter }
          : {}),
      }
    }

    return {
      route_type: "through_obstacle",
      start: routePoint.start,
      end: routePoint.end,
      from_layer: getLayerName(routePoint.start_layer),
      to_layer: getLayerName(routePoint.end_layer),
      width: routePoint.width,
    }
  })

/**
 * Converts PCB traces that already exist when autorouting starts into SRJ
 * `traces`. This includes manual copper rendered in an earlier render phase
 * and routed child-subcircuit copper.
 *
 * `connectsTo` is physical routing state, not electrical-net metadata. It must
 * contain only the PCB points joined by this exact copper trace so the parent
 * router can collapse already-routed child paths without collapsing an entire
 * net that still needs board-level routing.
 */
export const getPreservedRoutedSubcircuitTraces = ({
  scopedDb,
  relevantSubcircuitIds,
}: {
  scopedDb: CircuitJsonUtilObjects
  relevantSubcircuitIds: Set<string> | null
}): SimplifiedPcbTrace[] =>
  scopedDb.pcb_trace
    .list()
    .filter((trace) => {
      if (!trace.subcircuit_id) return false
      return (
        relevantSubcircuitIds === null ||
        relevantSubcircuitIds.has(trace.subcircuit_id)
      )
    })
    .map((trace) => {
      const preservedTrace = trace as PreservedTrace
      const connectionName = getPreservedTraceConnectionName(preservedTrace)
      return {
        type: "pcb_trace" as const,
        pcb_trace_id: trace.pcb_trace_id,
        source_trace_id: trace.source_trace_id,
        connection_name: connectionName,
        connectsTo: getPhysicalConnectionIdsForPreservedTrace(preservedTrace),
        route: getSimpleRouteForPreservedTrace(preservedTrace),
      }
    })
    .filter((trace) => trace.route.length >= 2)
