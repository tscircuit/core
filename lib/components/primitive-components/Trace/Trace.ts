import {
  MultilayerIjump,
  getObstaclesFromSoup,
} from "@tscircuit/infgrid-ijump-astar"
import { traceProps } from "@tscircuit/props"
import {
  type LayerRef,
  type PcbTrace,
  type PcbTraceRoutePoint,
  type RouteHintPoint,
  type SchematicTrace,
} from "circuit-json"
import { getFullConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"
import { DirectLineRouter } from "lib/utils/autorouting/DirectLineRouter"
import type {
  SimpleRouteConnection,
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { computeObstacleBounds } from "lib/utils/autorouting/computeObstacleBounds"
import { findPossibleTraceLayerCombinations } from "lib/utils/autorouting/findPossibleTraceLayerCombinations"
import { getDominantDirection } from "lib/utils/autorouting/getDominantDirection"
import { mergeRoutes } from "lib/utils/autorouting/mergeRoutes"
import { createNetsFromProps } from "lib/utils/components/createNetsFromProps"
import { getClosest } from "lib/utils/getClosest"
import { pairs } from "lib/utils/pairs"
import { countComplexElements } from "lib/utils/schematic/countComplexElements"
import { getEnteringEdgeFromDirection } from "lib/utils/schematic/getEnteringEdgeFromDirection"
import { getStubEdges } from "lib/utils/schematic/getStubEdges"
import { tryNow } from "lib/utils/try-now"
import { z } from "zod"
import { PrimitiveComponent } from "../../base-components/PrimitiveComponent"
import { Net } from "../Net"
import type { Port } from "../Port"
import type { TraceHint } from "../TraceHint"
import type { TraceI } from "./TraceI"
import { getTraceLength } from "./compute-trace-length"
import { createDownwardNetLabelGroundSymbol } from "./create-downward-net-label-ground-symbol"
import { createSchematicTraceCrossingSegments } from "./create-schematic-trace-crossing-segments"
import { createSchematicTraceJunctions } from "./create-schematic-trace-junctions"
import { getMaxLengthFromConnectedCapacitors } from "./get-max-length-from-conn ected-capacitors"
import { getSchematicObstaclesForTrace } from "./get-obstacles-for-trace"
import { getOtherSchematicTraces } from "./get-other-schematic-traces"
import { getTraceDisplayName } from "./get-trace-display-name"
import { pushEdgesOfSchematicTraceToPreventOverlap } from "./push-edges-of-schematic-trace-to-prevent-overlap"
import { isRouteOutsideBoard } from "lib/utils/is-route-outside-board"

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

export class Trace
  extends PrimitiveComponent<typeof traceProps>
  implements TraceI
{
  source_trace_id: string | null = null
  pcb_trace_id: string | null = null
  schematic_trace_id: string | null = null
  _portsRoutedOnPcb: Port[]
  subcircuit_connectivity_map_key: string | null = null
  _traceConnectionHash: string | null = null

  constructor(props: z.input<typeof traceProps>) {
    super(props)
    this._portsRoutedOnPcb = []
  }

  get config() {
    return {
      zodProps: traceProps,
      componentName: "Trace",
    }
  }

  _getTracePortOrNetSelectorListFromProps(): string[] {
    if ("from" in this.props && "to" in this.props) {
      return [
        typeof this.props.from === "string"
          ? this.props.from
          : this.props.from.getPortSelector(),
        typeof this.props.to === "string"
          ? this.props.to
          : this.props.to.getPortSelector(),
      ]
    }
    if ("path" in this.props) {
      return this.props.path.map((p) =>
        typeof p === "string" ? p : p.getPortSelector(),
      )
    }
    return []
  }

  getTracePortPathSelectors(): string[] {
    return this._getTracePortOrNetSelectorListFromProps().filter(
      (selector) => !selector.includes("net."),
    )
  }

  getTracePathNetSelectors(): string[] {
    return this._getTracePortOrNetSelectorListFromProps().filter((selector) =>
      selector.includes("net."),
    )
  }

  _findConnectedPorts():
    | {
        allPortsFound: true
        ports: Port[]
        portsWithSelectors: Array<{ selector: string; port: Port }>
      }
    | {
        allPortsFound: false
        ports?: undefined
        portsWithSelectors?: undefined
      } {
    const { db } = this.root!
    const { _parsedProps: props, parent } = this

    if (!parent) throw new Error("Trace has no parent")

    const portSelectors = this.getTracePortPathSelectors()

    const portsWithSelectors = portSelectors.map((selector) => ({
      selector,
      port:
        (this.getSubcircuit().selectOne(selector, { type: "port" }) as Port) ??
        null,
    }))

    for (const { selector, port } of portsWithSelectors) {
      if (!port) {
        const parentSelector = selector.replace(/(\> )?[^ ]+$/, "")
        const targetComponent = this.getSubcircuit().selectOne(parentSelector)
        if (!targetComponent) {
          this.renderError(`Could not find port for selector "${selector}"`)
        } else {
          this.renderError(
            `Could not find port for selector "${selector}" (did you forget to include the pin name?)\nsearched component ${targetComponent.getString()}, which has ports: ${targetComponent.children
              .filter((c) => c.componentName === "Port")
              .map(
                (c) => `${c.getString()}(${c.getNameAndAliases().join(",")})`,
              )
              .join(" & ")}`,
          )
        }
      }
    }

    if (portsWithSelectors.some((p) => !p.port)) {
      return { allPortsFound: false }
    }

    return {
      allPortsFound: true,
      portsWithSelectors,
      ports: portsWithSelectors.map(({ port }) => port),
    }
  }

  _findConnectedNets(): {
    nets: Net[]
    netsWithSelectors: Array<{ selector: string; net: Net }>
  } {
    const netsWithSelectors = this.getTracePathNetSelectors().map(
      (selector) => ({
        selector,
        net: this.getSubcircuit().selectOne(selector, { type: "net" }) as Net,
      }),
    )

    const undefinedNets = netsWithSelectors.filter((n) => !n.net)
    if (undefinedNets.length > 0) {
      this.renderError(
        `Could not find net for selector "${undefinedNets[0].selector}" inside ${this}`,
      )
    }

    return { netsWithSelectors, nets: netsWithSelectors.map((n) => n.net) }
  }

  /**
   * Get all the traces that are connected in any degree to this trace, this is
   * used during autorouting to routes to pass through traces connected to the
   * same net.
   */
  _getAllTracesConnectedToSameNet(): Trace[] {
    const traces = this.getSubcircuit().selectAll("trace") as Trace[]

    const myNets = this._findConnectedNets().nets
    const myPorts = this._findConnectedPorts().ports ?? []

    return traces.filter((t) => {
      if (t === this) return false
      const tNets = t._findConnectedNets().nets
      const tPorts = t._findConnectedPorts().ports ?? []
      return (
        tNets.some((n) => myNets.includes(n)) ||
        tPorts.some((p) => myPorts.includes(p))
      )
    })
  }

  /**
   * Determine if a trace is explicitly connected to a port (not via a net)
   */
  _isExplicitlyConnectedToPort(port: Port) {
    const { allPortsFound, portsWithSelectors: portsWithMetadata } =
      this._findConnectedPorts()
    if (!allPortsFound) return false
    const ports = portsWithMetadata.map((p) => p.port)
    return ports.includes(port)
  }

  /**
   * Determine if a trace is explicitly connected to a net (not via a port)
   */
  _isExplicitlyConnectedToNet(net: Net) {
    const nets = this._findConnectedNets().nets
    return nets.includes(net)
  }

  doInitialCreateNetsFromProps(): void {
    createNetsFromProps(this, this.getTracePathNetSelectors())
  }

  _computeTraceConnectionHash(): string | null {
    const { allPortsFound, ports } = this._findConnectedPorts()
    if (!allPortsFound || !ports) return null

    const sortedPorts = [...ports].sort((a, b) =>
      (a.pcb_port_id || "").localeCompare(b.pcb_port_id || ""),
    )
    const allIds = sortedPorts.map((p) => p.pcb_port_id)

    return allIds.join(",")
  }

  doInitialSourceTraceRender(): void {
    const { db } = this.root!
    const { _parsedProps: props, parent } = this

    if (!parent) {
      this.renderError("Trace has no parent")
      return
    }

    const { allPortsFound, portsWithSelectors: ports } =
      this._findConnectedPorts()
    if (!allPortsFound) return

    this._traceConnectionHash = this._computeTraceConnectionHash()

    const existingTraces = db.source_trace.list()
    const existingTrace = existingTraces.find(
      (t) =>
        t.subcircuit_connectivity_map_key ===
          this.subcircuit_connectivity_map_key &&
        t.connected_source_port_ids.sort().join(",") ===
          this._traceConnectionHash,
    )
    if (existingTrace) {
      this.source_trace_id = existingTrace.source_trace_id
      return
    }

    const nets = this._findConnectedNets().nets
    const displayName = getTraceDisplayName({ ports: ports, nets: nets })
    const trace = db.source_trace.insert({
      connected_source_port_ids: ports.map((p) => p.port.source_port_id!),
      connected_source_net_ids: nets.map((n) => n.source_net_id!),
      subcircuit_id: this.getSubcircuit()?.subcircuit_id!,
      max_length:
        getMaxLengthFromConnectedCapacitors(
          ports.map((p) => p.port),
          { db },
        ) ?? props.maxLength,
      display_name: displayName,
      min_trace_thickness: props.thickness,
    })

    this.source_trace_id = trace.source_trace_id
  }
  _insertErrorIfTraceIsOutsideBoard(
    mergedRoute: PcbTraceRoutePoint[],
    ports: Port[],
  ): void {
    const { db } = this.root!
    const isOutsideBoard = isRouteOutsideBoard(mergedRoute, { db })

    if (isOutsideBoard) {
      db.pcb_trace_error.insert({
        error_type: "pcb_trace_error",
        source_trace_id: this.source_trace_id!,
        message: `Trace ${this.getString()} routed outside the board boundaries.`,
        pcb_trace_id: this.pcb_trace_id!,
        pcb_component_ids: [],
        pcb_port_ids: ports.map((p) => p.pcb_port_id!),
      })
    }
  }
  doInitialPcbTraceRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props, parent } = this
    const subcircuit = this.getSubcircuit()

    if (!parent) throw new Error("Trace has no parent")

    if (subcircuit._parsedProps.routingDisabled) {
      return
    }

    // Check for cached route
    const cachedRoute = subcircuit._parsedProps.pcbRouteCache?.pcbTraces
    if (cachedRoute) {
      const pcb_trace = db.pcb_trace.insert({
        route: cachedRoute.flatMap((trace) => trace.route),
        source_trace_id: this.source_trace_id!,
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
      })
      this.pcb_trace_id = pcb_trace.pcb_trace_id
      return
    }

    if (!subcircuit._shouldUseTraceByTraceRouting()) {
      return
    }

    const { allPortsFound, ports } = this._findConnectedPorts()
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
        source_trace_id: this.source_trace_id!,
        message: `Some ports did not have a matching PCB primitive (e.g. a pad or plated hole), this can happen if a footprint is missing. As a result, ${this} wasn't routed. Missing ports: ${portsWithoutMatchedPcbPrimitive.map((p) => p.getString()).join(", ")}`,
        pcb_trace_id: this.pcb_trace_id!,
        pcb_component_ids: [],
        pcb_port_ids: portsWithoutMatchedPcbPrimitive
          .map((p) => p.pcb_port_id!)
          .filter(Boolean),
      })
      return
    }

    const nets = this._findConnectedNets().netsWithSelectors

    if (ports.length === 0 && nets.length === 2) {
      // Find the two optimal points to connect the two nets
      this.renderError(
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
      this.renderError(
        `Trace has more than one port and one or more nets, we don't currently support this type of complex trace routing`,
      )
      return
    }

    const hints = ports.flatMap((port) =>
      port.matchedComponents.filter((c) => c.componentName === "TraceHint"),
    ) as TraceHint[]

    const pcbRouteHints = (this._parsedProps.pcbRouteHints ?? []).concat(
      hints.flatMap((h) => h.getPcbRouteHints()),
    )

    if (ports.length > 2) {
      this.renderError(
        `Trace has more than two ports (${ports
          .map((p) => p.getString())
          .join(
            ", ",
          )}), routing between more than two ports for a single trace is not implemented`,
      )
      return
    }

    const alreadyRoutedTraces = this.getSubcircuit()
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
      this.renderError(
        `Could not find a common layer (using hints) for trace ${this.getString()}`,
      )
      return
    }

    const connMap = getFullConnectivityMapFromCircuitJson(
      this.root!.db.toArray(),
    )

    // Cache the PCB obstacles, they'll be needed for each segment between
    // ports/hints
    const [obstacles, errGettingObstacles] = tryNow(
      () => getObstaclesFromSoup(this.root!.db.toArray() as any), // Remove as any when autorouting-dataset gets updated
    )

    if (errGettingObstacles) {
      this.renderError({
        type: "pcb_trace_error",
        error_type: "pcb_trace_error",
        pcb_trace_error_id: this.pcb_trace_id!,
        message: `Error getting obstacles for autorouting: ${errGettingObstacles.message}`,
        source_trace_id: this.source_trace_id!,
        center: { x: 0, y: 0 },
        pcb_port_ids: ports.map((p) => p.pcb_port_id!),
        pcb_trace_id: this.pcb_trace_id!,
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
        this.getSubcircuit()._parsedProps.minTraceWidth ?? 0.16

      const ijump = new MultilayerIjump({
        OBSTACLE_MARGIN: minTraceWidth * 2,
        isRemovePathLoopsEnabled: true,
        optimizeWithGoalBoxes: Boolean(pcbPortA && pcbPortB),
        connMap,
        input: {
          obstacles,
          minTraceWidth,
          connections: [
            {
              name: this.source_trace_id!,
              pointsToConnect: [
                { ...a, layer: aLayer, pcb_port_id: pcbPortA! },
                { ...b, layer: bLayer, pcb_port_id: pcbPortB! },
              ],
            },
          ],
          layerCount: 2,
          bounds: {
            minX: Math.min(a.x, b.x) - BOUNDS_MARGIN,
            maxX: Math.max(a.x, b.x) + BOUNDS_MARGIN,
            minY: Math.min(a.y, b.y) - BOUNDS_MARGIN,
            maxY: Math.max(a.y, b.y) + BOUNDS_MARGIN,
          },
        },
      })
      let traces: SimplifiedPcbTrace[] | null = null
      try {
        traces = ijump.solveAndMapToTraces()
      } catch (e: any) {
        this.renderError({
          type: "pcb_trace_error",
          pcb_trace_error_id: this.source_trace_id!,
          error_type: "pcb_trace_error",
          message: `error solving route: ${e.message}`,
          source_trace_id: this.pcb_trace_id!,
          center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
          pcb_port_ids: ports.map((p) => p.pcb_port_id!),
          pcb_trace_id: this.pcb_trace_id!,
          pcb_component_ids: ports.map((p) => p.pcb_component_id!),
        })
      }
      if (!traces) return
      if (traces.length === 0) {
        this.renderError({
          type: "pcb_trace_error",
          error_type: "pcb_trace_error",
          pcb_trace_error_id: this.pcb_trace_id!,
          message: `Could not find a route for ${this}`,
          source_trace_id: this.source_trace_id!,
          center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
          pcb_port_ids: ports.map((p) => p.pcb_port_id!),
          pcb_trace_id: this.pcb_trace_id!,
          pcb_component_ids: ports.map((p) => p.pcb_component_id!),
        })
        return
      }
      const [trace] = traces as PcbTrace[]

      // If the autorouter didn't specify a layer, use the dominant layer
      // Some of the single-layer autorouters don't add the layer property
      if (dominantLayer) {
        trace.route = trace.route.map((p) => {
          if (p.route_type === "wire" && !p.layer) {
            p.layer = dominantLayer
          }
          return p
        })
      }

      if (pcbPortA && trace.route[0].route_type === "wire") {
        trace.route[0].start_pcb_port_id = pcbPortA
      }
      const lastRoutePoint = trace.route[trace.route.length - 1]
      if (pcbPortB && lastRoutePoint.route_type === "wire") {
        lastRoutePoint.end_pcb_port_id = pcbPortB
      }
      routes.push(trace.route)
    }
    const mergedRoute = mergeRoutes(routes)

    const traceLength = getTraceLength(mergedRoute)
    const pcb_trace = db.pcb_trace.insert({
      route: mergedRoute,
      source_trace_id: this.source_trace_id!,
      subcircuit_id: this.getSubcircuit()?.subcircuit_id!,
      trace_length: traceLength,
    })
    this._portsRoutedOnPcb = ports
    this.pcb_trace_id = pcb_trace.pcb_trace_id

    for (const point of mergedRoute) {
      if (point.route_type === "via") {
        db.pcb_via.insert({
          pcb_trace_id: pcb_trace.pcb_trace_id,
          x: point.x,
          y: point.y,
          hole_diameter: 0.3,
          outer_diameter: 0.6,
          layers: [point.from_layer as LayerRef, point.to_layer as LayerRef],
          from_layer: point.from_layer as LayerRef,
          to_layer: point.to_layer as LayerRef,
        })
      }
    }
    this._insertErrorIfTraceIsOutsideBoard(mergedRoute, ports)
  }

  _doInitialSchematicTraceRenderWithDisplayLabel(): void {
    if (this.root?.schematicDisabled) return
    const { db } = this.root!
    const { _parsedProps: props, parent } = this

    if (!parent) throw new Error("Trace has no parent")

    const { allPortsFound, portsWithSelectors: connectedPorts } =
      this._findConnectedPorts()

    if (!allPortsFound) return

    const portsWithPosition = connectedPorts.map(({ port }) => ({
      port,
      position: port._getGlobalSchematicPositionAfterLayout(),
      schematic_port_id: port.schematic_port_id!,
      facingDirection: port.facingDirection,
    }))
    if (portsWithPosition.length < 2) {
      throw new Error("Expected at least two ports in portsWithPosition.")
    }

    let fromPortName: any
    let toPortName: any
    const fromAnchorPos = portsWithPosition[0].position
    const fromPort = portsWithPosition[0].port

    // Validate `path`, `from`, and `to`
    if ("path" in this.props) {
      if (this.props.path.length !== 2) {
        throw new Error("Invalid 'path': Must contain exactly two elements.")
      }
      ;[fromPortName, toPortName] = this.props.path
    } else {
      if (!("from" in this.props && "to" in this.props)) {
        throw new Error("Missing 'from' or 'to' properties in props.")
      }
      fromPortName = this.props.from
      toPortName = this.props.to
    }

    if (!fromPort.source_port_id) {
      throw new Error(
        `Missing source_port_id for the 'from' port (${fromPortName}).`,
      )
    }
    const toAnchorPos = portsWithPosition[1].position
    const toPort = portsWithPosition[1].port

    if (!toPort.source_port_id) {
      throw new Error(
        `Missing source_port_id for the 'to' port (${toPortName}).`,
      )
    }

    // Handle `from` port label
    const existingFromNetLabel = db.schematic_net_label
      .list()
      .find((label) => label.source_net_id === fromPort.source_port_id)

    const existingToNetLabel = db.schematic_net_label
      .list()
      .find((label) => label.source_net_id === toPort.source_port_id)

    const [firstPort, secondPort] = connectedPorts.map(({ port }) => port)
    const isFirstPortSchematicBox =
      firstPort.parent?.config.shouldRenderAsSchematicBox
    const pinFullName = isFirstPortSchematicBox
      ? `${firstPort?.parent?.props.name}_${firstPort?.props.name}`
      : `${secondPort?.parent?.props.name}_${secondPort?.props.name}`

    const netLabelText = this.props.schDisplayLabel ?? pinFullName

    if (existingFromNetLabel && existingFromNetLabel.text !== netLabelText) {
      existingFromNetLabel.text = `${netLabelText} / ${existingFromNetLabel.text}`
    }

    if (existingToNetLabel && existingToNetLabel?.text !== netLabelText) {
      existingToNetLabel.text = `${netLabelText} / ${existingToNetLabel.text}`
    }

    if (
      netLabelText?.toLocaleLowerCase().includes("gnd") ||
      netLabelText?.toLocaleLowerCase().includes("ground")
    ) {
      if (!existingFromNetLabel && !existingToNetLabel) {
        createDownwardNetLabelGroundSymbol(
          {
            port: fromPort,
            anchorPos: fromAnchorPos,
            schDisplayLabel: this.props.schDisplayLabel!,
            source_trace_id: this.source_trace_id!,
          },
          { db },
        )

        createDownwardNetLabelGroundSymbol(
          {
            port: toPort,
            anchorPos: toAnchorPos,
            schDisplayLabel: this.props.schDisplayLabel!,
            source_trace_id: this.source_trace_id!,
          },
          { db },
        )
      } else if (!existingFromNetLabel) {
        createDownwardNetLabelGroundSymbol(
          {
            port: fromPort,
            anchorPos: fromAnchorPos,
            schDisplayLabel: this.props.schDisplayLabel!,
            source_trace_id: this.source_trace_id!,
          },
          { db },
        )
      } else if (!existingToNetLabel) {
        createDownwardNetLabelGroundSymbol(
          {
            port: toPort,
            anchorPos: toAnchorPos,
            schDisplayLabel: this.props.schDisplayLabel!,
            source_trace_id: this.source_trace_id!,
          },
          { db },
        )
      }
      return
    }

    if (!existingToNetLabel) {
      db.schematic_net_label.insert({
        text: this.props.schDisplayLabel! ?? pinFullName,
        source_net_id: toPort.source_port_id!,
        anchor_position: toAnchorPos,
        center: toAnchorPos,
        anchor_side:
          getEnteringEdgeFromDirection(toPort.facingDirection!) ?? "bottom",
      })
    }
    if (!existingFromNetLabel) {
      db.schematic_net_label.insert({
        text: this.props.schDisplayLabel! ?? pinFullName,
        source_net_id: fromPort.source_port_id!,
        anchor_position: fromAnchorPos,
        center: fromAnchorPos,
        anchor_side:
          getEnteringEdgeFromDirection(fromPort.facingDirection!) ?? "bottom",
      })
    }
  }

  private _isSymbolToChipConnection(): boolean | undefined {
    const { allPortsFound, ports } = this._findConnectedPorts()
    if (!allPortsFound || ports.length !== 2) return false
    const [port1, port2] = ports
    if (!port1?.parent || !port2?.parent) return false
    const isPort1Chip = port1.parent.config.shouldRenderAsSchematicBox
    const isPort2Chip = port2.parent.config.shouldRenderAsSchematicBox
    return (isPort1Chip && !isPort2Chip) || (!isPort1Chip && isPort2Chip)
  }

  private _isSymbolToSymbolConnection(): boolean | undefined {
    const { allPortsFound, ports } = this._findConnectedPorts()
    if (!allPortsFound || ports.length !== 2) return false
    const [port1, port2] = ports
    if (!port1?.parent || !port2?.parent) return false
    const isPort1Symbol = !port1.parent.config.shouldRenderAsSchematicBox
    const isPort2Symbol = !port2.parent.config.shouldRenderAsSchematicBox
    return isPort1Symbol && isPort2Symbol
  }
  private _isChipToChipConnection(): boolean | undefined {
    const { allPortsFound, ports } = this._findConnectedPorts()
    if (!allPortsFound || ports.length !== 2) return false
    const [port1, port2] = ports
    if (!port1?.parent || !port2?.parent) return false

    const isPort1Chip = port1.parent.config.shouldRenderAsSchematicBox
    const isPort2Chip = port2.parent.config.shouldRenderAsSchematicBox

    // Check if both ports are chips
    return isPort1Chip && isPort2Chip
  }

  doInitialSchematicTraceRender(): void {
    if (this.root?.schematicDisabled) return
    const { db } = this.root!
    const { _parsedProps: props, parent } = this

    if (!parent) throw new Error("Trace has no parent")

    const { allPortsFound, portsWithSelectors: connectedPorts } =
      this._findConnectedPorts()
    const { netsWithSelectors } = this._findConnectedNets()

    if (!allPortsFound) return

    const portIds = connectedPorts.map((p) => p.port.schematic_port_id).sort()
    const portPairKey = portIds.join(",")
    const board = this.root?._getBoard()
    if (board?._connectedSchematicPortPairs)
      if (board._connectedSchematicPortPairs.has(portPairKey)) {
        return
      }

    if (
      this.props.schDisplayLabel &&
      (("from" in this.props && "to" in this.props) || "path" in this.props)
    ) {
      this._doInitialSchematicTraceRenderWithDisplayLabel()
      return
    }

    const connection: SimpleRouteConnection = {
      name: this.source_trace_id!,
      pointsToConnect: [],
    }
    const obstacles = getSchematicObstaclesForTrace(this)

    // Get port positions for later use
    const portsWithPosition = connectedPorts.map(({ port }) => ({
      port,
      position: port._getGlobalSchematicPositionAfterLayout(),
      schematic_port_id: port.schematic_port_id ?? undefined,
      facingDirection: port.facingDirection,
    }))

    const isPortAndNetConnection =
      portsWithPosition.length === 1 && netsWithSelectors.length === 1

    if (isPortAndNetConnection) {
      const net = netsWithSelectors[0].net
      const { port, position: anchorPos } = portsWithPosition[0]

      // Create a schematic_net_label
      const netLabel = db.schematic_net_label.insert({
        text: net._parsedProps.name,
        source_net_id: net.source_net_id!,
        anchor_position: anchorPos,
        // TODO compute the center based on the text size
        center: anchorPos,
        anchor_side:
          getEnteringEdgeFromDirection(port.facingDirection!) ?? "bottom",
      })

      return
    }

    // Ensure there are at least two ports
    // Else return insufficient ports to draw a trace
    if (portsWithPosition.length < 2) {
      return
    }

    // Add points for autorouter to connect
    connection.pointsToConnect = portsWithPosition.map(({ position }) => ({
      ...position,
      layer: "top",
    }))

    const bounds = computeObstacleBounds(obstacles)

    const BOUNDS_MARGIN = 2 // mm
    const simpleRouteJsonInput: SimpleRouteJson = {
      minTraceWidth: 0.1,
      obstacles,
      connections: [connection],
      bounds: {
        minX: bounds.minX - BOUNDS_MARGIN,
        maxX: bounds.maxX + BOUNDS_MARGIN,
        minY: bounds.minY - BOUNDS_MARGIN,
        maxY: bounds.maxY + BOUNDS_MARGIN,
      },
      layerCount: 1,
    }

    let Autorouter = MultilayerIjump
    let skipOtherTraceInteraction = false
    if (this.getSubcircuit().props._schDirectLineRoutingEnabled) {
      Autorouter = DirectLineRouter as any
      skipOtherTraceInteraction = true
    }

    const autorouter = new Autorouter({
      input: simpleRouteJsonInput,
      MAX_ITERATIONS: 100,
      OBSTACLE_MARGIN: 0.1,
      isRemovePathLoopsEnabled: true,
      isShortenPathWithShortcutsEnabled: true,
      marginsWithCosts: [
        {
          margin: 1,
          enterCost: 0,
          travelCostFactor: 1,
        },
        {
          margin: 0.3,
          enterCost: 0,
          travelCostFactor: 1,
        },
        {
          margin: 0.2,
          enterCost: 0,
          travelCostFactor: 2,
        },
        {
          margin: 0.1,
          enterCost: 0,
          travelCostFactor: 3,
        },
      ],
    })
    let results = autorouter.solveAndMapToTraces()

    if (results.length === 0) {
      if (
        this._isSymbolToChipConnection() ||
        this._isSymbolToSymbolConnection() ||
        this._isChipToChipConnection()
      ) {
        this._doInitialSchematicTraceRenderWithDisplayLabel()
        return
      }
      const directLineRouter = new DirectLineRouter({
        input: simpleRouteJsonInput,
      })
      results = directLineRouter.solveAndMapToTraces()
      skipOtherTraceInteraction = true
    }

    const [{ route }] = results

    let edges: SchematicTrace["edges"] = []

    // Add autorouted path
    for (let i = 0; i < route.length - 1; i++) {
      edges.push({
        from: route[i],
        to: route[i + 1],
      })
    }

    const source_trace_id = this.source_trace_id!

    let junctions: SchematicTrace["junctions"] = []

    if (!skipOtherTraceInteraction) {
      // Check if these edges run along any other schematic traces, if they do
      // push them out of the way
      pushEdgesOfSchematicTraceToPreventOverlap({ edges, db, source_trace_id })

      // Find all intersections between myEdges and all otherEdges and create a
      // segment representing the crossing. Wherever there's a crossing, we create
      // 3 new edges. The middle edge has `is_crossing: true` and is 0.01mm wide
      const otherEdges: SchematicTrace["edges"] = getOtherSchematicTraces({
        db,
        source_trace_id,
        differentNetOnly: true,
      }).flatMap((t: SchematicTrace) => t.edges)
      edges = createSchematicTraceCrossingSegments({ edges, otherEdges })

      // Find all the intersections between myEdges and edges connected to the
      // same net and create junction points
      // Calculate junctions where traces of the same net intersect
      junctions = createSchematicTraceJunctions({
        edges,
        db,
        source_trace_id: this.source_trace_id!,
      })
    }

    // The first/last edges sometimes don't connect to the ports because the
    // autorouter is within the "goal box" and doesn't finish the route
    // Add a stub to connect the last point to the end port
    const lastEdge = edges[edges.length - 1]
    const lastEdgePort = portsWithPosition[portsWithPosition.length - 1]
    const lastDominantDirection = getDominantDirection(lastEdge)

    // Add the connecting edges
    edges.push(
      ...getStubEdges({ lastEdge, lastEdgePort, lastDominantDirection }),
    )

    const firstEdge = edges[0]
    const firstEdgePort = portsWithPosition[0]
    const firstDominantDirection = getDominantDirection(firstEdge)

    // Add the connecting edges
    edges.unshift(
      ...getStubEdges({
        firstEdge,
        firstEdgePort,
        firstDominantDirection,
      }),
    )

    // Handle case where no labels are created and trace is inserted
    if (!this.source_trace_id) {
      throw new Error("Missing source_trace_id for schematic trace insertion.")
    }

    if (
      this.getSubcircuit()._parsedProps.schTraceAutoLabelEnabled &&
      countComplexElements(junctions, edges) >= 5 &&
      (this._isSymbolToChipConnection() ||
        this._isSymbolToSymbolConnection() ||
        this._isChipToChipConnection())
    ) {
      this._doInitialSchematicTraceRenderWithDisplayLabel()
      return
    }

    // Insert schematic trace
    const trace = db.schematic_trace.insert({
      source_trace_id: this.source_trace_id!,
      edges,
      junctions,
    })
    this.schematic_trace_id = trace.schematic_trace_id

    if (board?._connectedSchematicPortPairs)
      board._connectedSchematicPortPairs.add(portPairKey)
  }
}
