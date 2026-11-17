import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { LayerRef, PcbTrace, PcbVia } from "circuit-json"
import type { SimplifiedPcbTrace } from "./SimpleRouteJson"

type PreservedTrace = PcbTrace & {
  connection_name?: string
  connectsTo?: string[]
}

type SrjViaRoutePoint = Extract<
  SimplifiedPcbTrace["route"][number],
  { route_type: "via" }
>

type PreservedViaRoutePoint = Extract<
  PcbTrace["route"][number],
  { route_type: "via" }
> &
  Pick<SrjViaRoutePoint, "layers" | "via_diameter" | "via_hole_diameter">

type ViaPositionKey = `${PcbVia["x"]},${PcbVia["y"]}`

const getViaPositionKey = (point: Pick<PcbVia, "x" | "y">): ViaPositionKey =>
  `${point.x},${point.y}`

/** Recover a known barrel in board-world mm (+X right, +Y up, +Z above).
 * Coordinates are copied from the same Circuit JSON, so exact point matching
 * is intentional. Shared vias may be linked to a sibling trace; both logical
 * endpoint layers must lie on the physical barrel. No manufacture rule can
 * replace a known old barrel. Conflicting physical facts stay an explicit error.
 */
const getPreservedViaLayers = ({
  trace,
  routePoint,
  physicalVias,
}: {
  trace: PreservedTrace
  routePoint: PreservedViaRoutePoint
  physicalVias: readonly PcbVia[]
}): SrjViaRoutePoint["layers"] => {
  if (routePoint.layers !== undefined) return [...routePoint.layers]
  const relevantVias = physicalVias.filter(
    (via) =>
      via.pcb_trace_id === trace.pcb_trace_id ||
      via.subcircuit_id === trace.subcircuit_id ||
      via.subcircuit_id == null,
  )
  if (relevantVias.length === 0) return undefined
  const endpointVias = relevantVias.filter(
    (via) =>
      via.layers.some(
        (layer) => layer === getLayerName(routePoint.from_layer),
      ) &&
      via.layers.some((layer) => layer === getLayerName(routePoint.to_layer)),
  )
  if (endpointVias.length === 0) {
    throw new Error(
      "Existing routed via's physical span does not include its routed layers",
    )
  }
  const linkedVias = endpointVias.filter(
    (via) => via.pcb_trace_id === trace.pcb_trace_id,
  )
  const candidates = linkedVias.length ? linkedVias : endpointVias
  const firstSpan = new Set(candidates[0]!.layers)
  if (
    candidates.some((via) => {
      const span = new Set(via.layers)
      return (
        span.size !== firstSpan.size ||
        [...span].some((layer) => !firstSpan.has(layer))
      )
    })
  ) {
    throw new Error("Existing routed via has ambiguous physical layer spans")
  }
  return [...candidates[0]!.layers]
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

const getSimpleRouteForPreservedTrace = ({
  trace,
  physicalViasByPosition,
}: {
  trace: PreservedTrace
  physicalViasByPosition: ReadonlyMap<ViaPositionKey, readonly PcbVia[]>
}): SimplifiedPcbTrace["route"] =>
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
      const layers = getPreservedViaLayers({
        trace,
        routePoint: preservedViaRoutePoint,
        physicalVias:
          physicalViasByPosition.get(getViaPositionKey(routePoint)) ?? [],
      })
      return {
        route_type: "via",
        x: routePoint.x,
        y: routePoint.y,
        from_layer: getLayerName(routePoint.from_layer),
        to_layer: getLayerName(routePoint.to_layer),
        ...(layers !== undefined ? { layers } : {}),
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
 * Footprint copper without a source trace is already represented as obstacles
 * by getSimpleRouteJsonFromCircuitJson. It must not also become a preloaded
 * route that the autorouter can reshape or validate against its own keepout.
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
}): SimplifiedPcbTrace[] => {
  const pcbTraces = scopedDb.pcb_trace.list()
  const pcbTracesById = new Map(
    pcbTraces.map((trace) => [trace.pcb_trace_id, trace]),
  )
  const physicalViasByPosition = new Map<ViaPositionKey, PcbVia[]>()
  for (const via of scopedDb.pcb_via.list()) {
    // Public Circuit JSON imports can omit a via's optional scope. Its actual
    // linked trace supplies ownership, including shared barrels linked once.
    const subcircuitId =
      via.subcircuit_id ??
      (via.pcb_trace_id
        ? pcbTracesById.get(via.pcb_trace_id)?.subcircuit_id
        : undefined)
    const physicalVia =
      subcircuitId === via.subcircuit_id
        ? via
        : { ...via, subcircuit_id: subcircuitId }
    const position = getViaPositionKey(via)
    const atPosition = physicalViasByPosition.get(position)
    if (atPosition) atPosition.push(physicalVia)
    else physicalViasByPosition.set(position, [physicalVia])
  }
  return pcbTraces
    .filter((trace) => {
      if (!trace.subcircuit_id) return false
      if (trace.pcb_component_id && !trace.source_trace_id) return false
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
        route: getSimpleRouteForPreservedTrace({
          trace: preservedTrace,
          physicalViasByPosition,
        }),
      }
    })
    .filter((trace) => trace.route.length >= 2)
}
