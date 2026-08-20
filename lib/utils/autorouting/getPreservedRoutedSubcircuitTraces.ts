import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { LayerRef, PcbTrace } from "circuit-json"
import type { SimpleRoutePoint, SimplifiedPcbTrace } from "./SimpleRouteJson"

type PreservedTrace = PcbTrace & {
  connection_name?: string
  connectsTo?: string[]
}

const getLayerName = (layer: LayerRef | { name: string }): string =>
  typeof layer === "string" ? layer : layer.name

const PRESERVED_TRACE_CONNECTION_POINT_SPACING_MM = 0.5

type WireRoutePoint = Extract<
  SimplifiedPcbTrace["route"][number],
  { route_type: "wire" }
>

export type PreservedTraceConnectionPoint = SimpleRoutePoint & {
  pointId: string
}

const getConnectionPointKey = (point: {
  x: number
  y: number
  layer: string
}) => `${point.x.toFixed(6)}:${point.y.toFixed(6)}:${point.layer}`

/**
 * Samples legal parent-connection attachment points along already-routed child
 * copper. Each point receives a stable ID that is also placed in the
 * preserved trace's `connectsTo` array, allowing the autorouter's MST to treat
 * the sampled points as alternative contacts on the same copper rather than
 * terminals that all need new routes.
 */
export const getPreservedTraceConnectionPoints = (
  trace: Pick<SimplifiedPcbTrace, "pcb_trace_id" | "route">,
): PreservedTraceConnectionPoint[] => {
  const sampledPoints: Array<{ x: number; y: number; layer: string }> = []
  const sampledPointKeys = new Set<string>()

  const addPoint = (point: { x: number; y: number; layer: string }) => {
    const key = getConnectionPointKey(point)
    if (sampledPointKeys.has(key)) return
    sampledPointKeys.add(key)
    sampledPoints.push(point)
  }

  let previousWirePoint: WireRoutePoint | undefined
  for (const routePoint of trace.route) {
    if (routePoint.route_type === "wire") {
      if (previousWirePoint?.layer === routePoint.layer) {
        const dx = routePoint.x - previousWirePoint.x
        const dy = routePoint.y - previousWirePoint.y
        const segmentLength = Math.hypot(dx, dy)
        const segmentCount = Math.max(
          1,
          Math.ceil(
            segmentLength / PRESERVED_TRACE_CONNECTION_POINT_SPACING_MM,
          ),
        )
        for (
          let segmentIndex = 0;
          segmentIndex < segmentCount;
          segmentIndex++
        ) {
          const t = segmentIndex / segmentCount
          addPoint({
            x: previousWirePoint.x + dx * t,
            y: previousWirePoint.y + dy * t,
            layer: routePoint.layer,
          })
        }
      }
      addPoint({
        x: routePoint.x,
        y: routePoint.y,
        layer: routePoint.layer,
      })
      previousWirePoint = routePoint
      continue
    }

    if (routePoint.route_type === "via") {
      addPoint({
        x: routePoint.x,
        y: routePoint.y,
        layer: routePoint.from_layer,
      })
      addPoint({
        x: routePoint.x,
        y: routePoint.y,
        layer: routePoint.to_layer,
      })
    } else if (routePoint.route_type === "through_obstacle") {
      addPoint({ ...routePoint.start, layer: routePoint.from_layer })
      addPoint({ ...routePoint.end, layer: routePoint.to_layer })
    }
    previousWirePoint = undefined
  }

  return sampledPoints.map((point, pointIndex) => ({
    ...point,
    pointId: `pcb_trace_route_point_${trace.pcb_trace_id}_${pointIndex}`,
  }))
}

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
      return {
        route_type: "via",
        x: routePoint.x,
        y: routePoint.y,
        from_layer: getLayerName(routePoint.from_layer),
        to_layer: getLayerName(routePoint.to_layer),
        ...(routePoint.outer_diameter !== undefined
          ? { via_diameter: routePoint.outer_diameter }
          : {}),
        ...(routePoint.hole_diameter !== undefined
          ? { via_hole_diameter: routePoint.hole_diameter }
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
      const simplifiedTrace: SimplifiedPcbTrace = {
        type: "pcb_trace" as const,
        pcb_trace_id: trace.pcb_trace_id,
        source_trace_id: trace.source_trace_id,
        subcircuit_id: trace.subcircuit_id,
        connection_name: connectionName,
        connectsTo: getPhysicalConnectionIdsForPreservedTrace(preservedTrace),
        route: getSimpleRouteForPreservedTrace(preservedTrace),
      }
      return simplifiedTrace
    })
    .filter((trace) => trace.route.length >= 2)
