import type { Trace } from "./Trace"
import { type LayerRef, type PcbTrace, type RouteHintPoint } from "circuit-json"
import { getFullConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"
import type { SimplifiedPcbTrace } from "lib/utils/autorouting/SimpleRouteJson"
import { findPossibleTraceLayerCombinations } from "lib/utils/autorouting/findPossibleTraceLayerCombinations"
import { mergeRoutes } from "lib/utils/autorouting/mergeRoutes"
import { getClosest } from "lib/utils/getClosest"
import { pairs } from "lib/utils/pairs"
import { tryNow } from "lib/utils/try-now"
import type { Port } from "../Port"
import type { TraceHint } from "../TraceHint"
import { getTraceLength } from "./trace-utils/compute-trace-length"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"
import { getViaDiameterDefaults } from "lib/utils/pcbStyle/getViaDiameterDefaults"
import { TscircuitAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"

type PcbRouteObjective =
  | RouteHintPoint
  | {
      layers: string[]
      x: number
      y: number
      via?: boolean
      pcb_port_id?: string
    }

const portToObjective = (port: Port): PcbRouteObjective => {
  const portPosition = port._getGlobalPcbPositionAfterLayout()
  return {
    ...portPosition,
    layers: port.getAvailablePcbLayers(),
  }
}

const SHOULD_USE_SINGLE_LAYER_ROUTING = false

export function Trace_doInitialPcbTraceRender(trace: Trace) {
  if (trace.root?.pcbDisabled) return
  const { db } = trace.root!
  const { _parsedProps: props, parent } = trace
  const subcircuit = trace.getSubcircuit()

  if (!parent) throw new Error("Trace has no parent")

  if (subcircuit._parsedProps.routingDisabled) {
    return
  }

  // Check for cached route
  const cachedRoute = subcircuit._parsedProps.pcbRouteCache?.pcbTraces
  if (cachedRoute) {
    const pcb_trace = db.pcb_trace.insert({
      route: cachedRoute.flatMap((trace) => trace.route),
      source_trace_id: trace.source_trace_id!,
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      pcb_group_id: trace.getGroup()?.pcb_group_id ?? undefined,
    })
    trace.pcb_trace_id = pcb_trace.pcb_trace_id
    return
  }

  // Manual traces are handled in PcbManualTraceRender phase
  if (props.pcbPath && props.pcbPath.length > 0) {
    return
  }

  if (props.pcbStraightLine) {
    return
  }

  if (!subcircuit._shouldUseTraceByTraceRouting()) {
    return
  }

  const { allPortsFound, ports } = trace._findConnectedPorts()
  const portsConnectedOnPcbViaNet: Port[] = []

  if (!allPortsFound) return

  const portsWithoutMatchedPcbPrimitive: Port[] = []
  for (const port of ports) {
    if (!port._hasMatchedPcbPrimitive()) {
      portsWithoutMatchedPcbPrimitive.push(port)
    }
  }

  if (portsWithoutMatchedPcbPrimitive.length > 0) {
    db.pcb_trace_error.insert({
      error_type: "pcb_trace_error",
      source_trace_id: trace.source_trace_id!,
      message: `Some ports did not have a matching PCB primitive (e.g. a pad or plated hole), this can happen if a footprint is missing. As a result, ${trace} wasn't routed. Missing ports: ${portsWithoutMatchedPcbPrimitive.map((p) => p.getString()).join(", ")}`,
      pcb_trace_id: trace.pcb_trace_id!,
      pcb_component_ids: [],
      pcb_port_ids: portsWithoutMatchedPcbPrimitive
        .map((p) => p.pcb_port_id!)
        .filter(Boolean),
    })
    return
  }

  const nets = trace._findConnectedNets().netsWithSelectors

  if (ports.length === 0 && nets.length === 2) {
    // Find the two optimal points to connect the two nets
    trace.renderError(
      `Trace connects two nets, we haven't implemented a way to route this yet`,
    )
    return
    // biome-ignore lint/style/noUselessElse: <explanation>
  } else if (ports.length === 1 && nets.length === 1) {
    // Add a port from the net that is closest to the port
    const port = ports[0]
    const portsInNet = nets[0].net.getAllConnectedPorts()
    const otherPortsInNet = portsInNet.filter((p) => p !== port)
    if (otherPortsInNet.length === 0) {
      console.log(
        "Nothing to connect this port to, the net is empty. TODO should emit a warning!",
      )
      return
    }
    const closestPortInNet = getClosest(port, otherPortsInNet)

    portsConnectedOnPcbViaNet.push(closestPortInNet)

    ports.push(closestPortInNet)
  } else if (ports.length > 1 && nets.length >= 1) {
    trace.renderError(
      `Trace has more than one port and one or more nets, we don't currently support this type of complex trace routing`,
    )
    return
  }

  const hints = ports.flatMap((port) =>
    port.matchedComponents.filter((c) => c.componentName === "TraceHint"),
  ) as TraceHint[]

  const pcbRouteHints = (trace._parsedProps.pcbRouteHints ?? []).concat(
    hints.flatMap((h) => h.getPcbRouteHints()),
  )

  if (ports.length > 2) {
    trace.renderError(
      `Trace has more than two ports (${ports
        .map((p) => p.getString())
        .join(
          ", ",
        )}), routing between more than two ports for a single trace is not implemented`,
    )
    return
  }

  const alreadyRoutedTraces = trace
    .getSubcircuit()
    .selectAll("trace")
    .filter(
      (trace) => trace.renderPhaseStates.PcbTraceRender.initialized,
    ) as Trace[]

  const isAlreadyRouted = alreadyRoutedTraces.some(
    (trace) =>
      trace._portsRoutedOnPcb.length === ports.length &&
      trace._portsRoutedOnPcb.every((portRoutedByOtherTrace) =>
        ports.includes(portRoutedByOtherTrace),
      ),
  )

  if (isAlreadyRouted) {
    return
  }

  let orderedRouteObjectives: PcbRouteObjective[] = []

  if (pcbRouteHints.length === 0) {
    orderedRouteObjectives = [
      portToObjective(ports[0]),
      portToObjective(ports[1]),
    ]
  } else {
    // When we have hints, we have to order the hints then route between each
    // terminal of the trace and the hints
    // TODO order based on proximity to ports
    orderedRouteObjectives = [
      portToObjective(ports[0]),
      ...pcbRouteHints,
      portToObjective(ports[1]),
    ]
  }

  // Hints can indicate where there should be a via, but the layer is allowed
  // to be unspecified, therefore we need to find possible layer combinations
  // to go to each hint and still route to the start and end points
  const candidateLayerCombinations = findPossibleTraceLayerCombinations(
    orderedRouteObjectives,
  )

  if (
    SHOULD_USE_SINGLE_LAYER_ROUTING &&
    candidateLayerCombinations.length === 0
  ) {
    trace.renderError(
      `Could not find a common layer (using hints) for trace ${trace.getString()}`,
    )
    return
  }

  const connMap = getFullConnectivityMapFromCircuitJson(
    trace.root!.db.toArray(),
  )

  // Cache the PCB obstacles, they'll be needed for each segment between
  // ports/hints
  const [obstacles, errGettingObstacles] = tryNow(
    () => getObstaclesFromCircuitJson(trace.root!.db.toArray() as any), // Remove as any when autorouting-dataset gets updated
  )

  if (errGettingObstacles) {
    trace.renderError({
      type: "pcb_trace_error",
      error_type: "pcb_trace_error",
      pcb_trace_error_id: trace.pcb_trace_id!,
      message: `Error getting obstacles for autorouting: ${errGettingObstacles.message}`,
      source_trace_id: trace.source_trace_id!,
      center: { x: 0, y: 0 },
      pcb_port_ids: ports.map((p) => p.pcb_port_id!),
      pcb_trace_id: trace.pcb_trace_id!,
      pcb_component_ids: [],
    })
    return
  }

  for (const obstacle of obstacles) {
    const connectedTo = obstacle.connectedTo
    if (connectedTo.length > 0) {
      const netId = connMap.getNetConnectedToId(obstacle.connectedTo[0])
      if (netId) {
        obstacle.connectedTo.push(netId)
      }
    }
  }

  let orderedRoutePoints: PcbRouteObjective[] = []
  if (candidateLayerCombinations.length === 0) {
    orderedRoutePoints = orderedRouteObjectives
  } else {
    // TODO explore all candidate layer combinations if one fails
    const candidateLayerSelections = candidateLayerCombinations[0].layer_path

    /**
     * Apply the candidate layer selections to the route objectives, now we
     * have a set of points that have definite layers
     */
    orderedRoutePoints = orderedRouteObjectives.map((t, idx) => {
      if (t.via) {
        return {
          ...t,
          via_to_layer: candidateLayerSelections[idx],
        }
      }
      return { ...t, layers: [candidateLayerSelections[idx]] }
    })
  }
  ;(orderedRoutePoints[0] as any).pcb_port_id = ports[0].pcb_port_id
  ;(orderedRoutePoints[orderedRoutePoints.length - 1] as any).pcb_port_id =
    ports[1].pcb_port_id

  const routes: PcbTrace["route"][] = []
  for (const [a, b] of pairs(orderedRoutePoints)) {
    const dominantLayer =
      "via_to_layer" in a ? (a.via_to_layer as LayerRef) : null
    const BOUNDS_MARGIN = 2 //mm

    const aLayer =
      "layers" in a && a.layers.length === 1
        ? a.layers[0]
        : (dominantLayer ?? "top")
    const bLayer =
      "layers" in b && b.layers.length === 1
        ? b.layers[0]
        : (dominantLayer ?? "top")

    const pcbPortA = "pcb_port_id" in a ? a.pcb_port_id : null
    const pcbPortB = "pcb_port_id" in b ? b.pcb_port_id : null

    const minTraceWidth =
      trace._getExplicitTraceThickness() ??
      trace.getSubcircuit()._parsedProps.minTraceWidth ??
      0.16

    const autorouter = new TscircuitAutorouter(
      {
        obstacles,
        minTraceWidth,
        connections: [
          {
            name: trace.source_trace_id!,
            pointsToConnect: [
              { ...a, layer: aLayer, pcb_port_id: pcbPortA! },
              { ...b, layer: bLayer, pcb_port_id: pcbPortB! },
            ],
          },
        ],
        layerCount: trace.getSubcircuit()._getSubcircuitLayerCount(),
        bounds: {
          minX: Math.min(a.x, b.x) - BOUNDS_MARGIN,
          maxX: Math.max(a.x, b.x) + BOUNDS_MARGIN,
          minY: Math.min(a.y, b.y) - BOUNDS_MARGIN,
          maxY: Math.max(a.y, b.y) + BOUNDS_MARGIN,
        },
      },
      {
        autorouterVersion: "v1",
      },
    )
    let traces: SimplifiedPcbTrace[] | null = null
    try {
      traces = autorouter.solveSync()
    } catch (e: any) {
      trace.renderError({
        type: "pcb_trace_error",
        pcb_trace_error_id: trace.source_trace_id!,
        error_type: "pcb_trace_error",
        message: `error solving route: ${e.message}`,
        source_trace_id: trace.pcb_trace_id!,
        center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        pcb_port_ids: ports.map((p) => p.pcb_port_id!),
        pcb_trace_id: trace.pcb_trace_id!,
        pcb_component_ids: ports.map((p) => p.pcb_component_id!),
      })
    }
    if (!traces) return
    if (traces.length === 0) {
      trace.renderError({
        type: "pcb_trace_error",
        error_type: "pcb_trace_error",
        pcb_trace_error_id: trace.pcb_trace_id!,
        message: `Could not find a route for ${trace}`,
        source_trace_id: trace.source_trace_id!,
        center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        pcb_port_ids: ports.map((p) => p.pcb_port_id!),
        pcb_trace_id: trace.pcb_trace_id!,
        pcb_component_ids: ports.map((p) => p.pcb_component_id!),
      })
      return
    }
    const [autoroutedTrace] = traces as PcbTrace[]

    // If the autorouter didn't specify a layer, use the dominant layer
    // Some of the single-layer autorouters don't add the layer property
    if (dominantLayer) {
      autoroutedTrace.route = autoroutedTrace.route.map((p) => {
        if (p.route_type === "wire" && !p.layer) {
          p.layer = dominantLayer
        }
        return p
      })
    }

    if (pcbPortA && autoroutedTrace.route[0].route_type === "wire") {
      autoroutedTrace.route[0].start_pcb_port_id = pcbPortA
    }
    const lastRoutePoint =
      autoroutedTrace.route[autoroutedTrace.route.length - 1]
    if (pcbPortB && lastRoutePoint.route_type === "wire") {
      lastRoutePoint.end_pcb_port_id = pcbPortB
    }
    routes.push(autoroutedTrace.route)
  }
  const mergedRoute = mergeRoutes(routes)

  const traceLength = getTraceLength(mergedRoute)
  const pcbStyle = trace.getInheritedMergedProperty("pcbStyle")
  const { holeDiameter, padDiameter } = getViaDiameterDefaults(pcbStyle)
  const pcb_trace = db.pcb_trace.insert({
    route: mergedRoute,
    source_trace_id: trace.source_trace_id!,
    subcircuit_id: trace.getSubcircuit()?.subcircuit_id!,
    trace_length: traceLength,
  })
  trace._portsRoutedOnPcb = ports
  trace.pcb_trace_id = pcb_trace.pcb_trace_id

  for (const point of mergedRoute) {
    if (point.route_type === "via") {
      db.pcb_via.insert({
        pcb_trace_id: pcb_trace.pcb_trace_id,
        x: point.x,
        y: point.y,
        hole_diameter: holeDiameter,
        outer_diameter: padDiameter,
        layers: [point.from_layer as LayerRef, point.to_layer as LayerRef],
        from_layer: point.from_layer as LayerRef,
        to_layer: point.to_layer as LayerRef,
      })
    }
  }
  trace._insertErrorIfTraceIsOutsideBoard(mergedRoute, ports)
}
