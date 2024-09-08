import { traceProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import type { Port } from "./Port"
import {
  IJumpAutorouter,
  autoroute,
  getObstaclesFromSoup,
  markObstaclesAsConnected,
} from "@tscircuit/infgrid-ijump-astar"
import type {
  AnySoupElement,
  PCBTrace,
  RouteHintPoint,
  SchematicTrace,
  SourceTrace,
} from "@tscircuit/soup"
import type {
  Obstacle,
  SimpleRouteConnection,
  SimpleRouteJson,
} from "lib/utils/autorouting/SimpleRouteJson"
import { computeObstacleBounds } from "lib/utils/autorouting/computeObstacleBounds"
import { projectPointInDirection } from "lib/utils/projectPointInDirection"
import type { TraceHint } from "./TraceHint"
import {
  findPossibleTraceLayerCombinations,
  type CandidateTraceLayerCombination,
} from "lib/utils/autorouting/findPossibleTraceLayerCombinations"
import { pairs } from "lib/utils/pairs"
import { mergeRoutes } from "lib/utils/autorouting/mergeRoutes"
import type { Net } from "./Net"
import { getClosest } from "lib/utils/getClosest"
import { z } from "zod"
import { createNetsFromProps } from "lib/utils/components/createNetsFromProps"
import {
  isMatchingPathSelector,
  isMatchingSelector,
} from "lib/utils/selector-matching"

type PcbRouteObjective =
  | RouteHintPoint
  | { layers: string[]; x: number; y: number; via?: boolean }

const portToObjective = (port: Port): PcbRouteObjective => {
  const portPosition = port._getGlobalPcbPositionAfterLayout()
  return {
    ...portPosition,
    layers: port.getAvailablePcbLayers(),
  }
}

export class Trace extends PrimitiveComponent<typeof traceProps> {
  source_trace_id: string | null = null
  pcb_trace_id: string | null = null
  schematic_trace_id: string | null = null
  _portsRoutedOnPcb: Port[]

  constructor(props: z.input<typeof traceProps>) {
    super(props)
    this._portsRoutedOnPcb = []
  }

  get config() {
    return {
      zodProps: traceProps,
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
        const parentSelector = selector.replace(/\>.*$/, "")
        const targetComponent = this.getSubcircuit().selectOne(parentSelector)
        if (!targetComponent) {
          this.renderError(`Could not find port for selector "${selector}"`)
        } else {
          this.renderError(
            `Could not find port for selector "${selector}"\nsearched component ${targetComponent.getString()}, which has ports: ${targetComponent.children
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

    const nets = this._findConnectedNets().nets

    const trace = db.source_trace.insert({
      connected_source_port_ids: ports.map((p) => p.port.source_port_id!),
      connected_source_net_ids: nets.map((n) => n.source_net_id!),
    })

    this.source_trace_id = trace.source_trace_id
  }

  doInitialPcbTraceRender(): void {
    const { db } = this.root!
    const { _parsedProps: props, parent } = this

    if (!parent) throw new Error("Trace has no parent")

    const { allPortsFound, ports } = this._findConnectedPorts()
    const portsConnectedOnPcbViaNet: Port[] = []

    if (!allPortsFound) return

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

    const pcbElements: AnySoupElement[] = db
      .toArray()
      .filter(
        (elm) =>
          elm.type === "pcb_smtpad" ||
          elm.type === "pcb_trace" ||
          elm.type === "pcb_plated_hole" ||
          elm.type === "pcb_hole" ||
          elm.type === "source_port" ||
          elm.type === "pcb_port" ||
          elm.type === "source_trace",
      )

    const source_trace = db.source_trace.get(this.source_trace_id!)!

    const hints = ports.flatMap((port) =>
      port.matchedComponents.filter((c) => c.componentName === "TraceHint"),
    ) as TraceHint[]

    const manualTraceHints =
      this.getSubcircuit().props.layout?.manual_trace_hints ?? []
    console.log("manualTraceHints", manualTraceHints)
    // manualTraceHints [
    //   {
    //     pcb_port_selector: ".R1 > .pin2",
    //     offsets: [
    //       {
    //         x: 0,
    //         y: 5,
    //         via: false,
    //       }
    //     ],
    //   }
    // ]
    const pcbRouteHints = (this._parsedProps.pcbRouteHints ?? [])
      .concat(hints.flatMap((h) => h.getPcbRouteHints()))
      .concat(
        manualTraceHints
          .filter((hint: { pcb_port_selector: string }) =>
            ports.some((port) =>
              isMatchingPathSelector(port, hint.pcb_port_selector),
            ),
          )
          .flatMap((hint: { offsets: RouteHintPoint[] }) => hint.offsets),
      )

    console.log("pcbRouteHints", pcbRouteHints)
    // pcbRouteHints [
    //   {
    //     x: 0,
    //     y: 1,
    //     via: undefined,
    //     to_layer: undefined,
    //     trace_width: undefined,
    //   }
    // ]

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

    if (candidateLayerCombinations.length === 0) {
      this.renderError(
        `Could not find a common layer (using hints) for trace ${this.getString()}`,
      )
    }

    // Cache the PCB obstacles, they'll be needed for each segment between
    // ports/hints
    const obstacles = getObstaclesFromSoup(this.root!.db.toArray())
    markObstaclesAsConnected(
      obstacles,
      orderedRouteObjectives,
      this.source_trace_id!,
    )

    const allConnectedTraceIds = this._getAllTracesConnectedToSameNet().map(
      (t) => t.source_trace_id,
    )
    for (const obstacle of obstacles) {
      if (
        obstacle.connectedTo.some((connection) =>
          allConnectedTraceIds.includes(connection),
        )
      ) {
        obstacle.connectedTo.push(this.source_trace_id!)
      }
    }

    // TODO explore all candidate layer combinations if one fails
    const candidateLayerSelections = candidateLayerCombinations[0].layer_path

    /**
     * Apply the candidate layer selections to the route objectives, now we
     * have a set of points that have definite layers
     */
    const orderedRoutePoints = orderedRouteObjectives.map((t, idx) => {
      if (t.via) {
        return {
          ...t,
          via_to_layer: candidateLayerSelections[idx],
        }
      }
      return { ...t, layers: [candidateLayerSelections[idx]] }
    })

    const routes: PCBTrace["route"][] = []
    for (const [a, b] of pairs(orderedRoutePoints)) {
      const BOUNDS_MARGIN = 2 //mm
      const ijump = new IJumpAutorouter({
        OBSTACLE_MARGIN: 0.3,
        input: {
          obstacles,
          connections: [
            {
              name: this.source_trace_id!,
              pointsToConnect: [a, b],
            },
          ],
          layerCount: 1,
          bounds: {
            minX: Math.min(a.x, b.x) - BOUNDS_MARGIN,
            maxX: Math.max(a.x, b.x) + BOUNDS_MARGIN,
            minY: Math.min(a.y, b.y) - BOUNDS_MARGIN,
            maxY: Math.max(a.y, b.y) + BOUNDS_MARGIN,
          },
        },
      })
      const traces = ijump.solveAndMapToTraces()
      if (traces.length === 0) {
        console.log(
          `Could not find a route between ${a} and ${b} for ${this} (TODO render error)`,
        )
        return
      }
      // TODO ijump returns multiple traces for some reason
      const [trace] = traces as PCBTrace[]
      routes.push(trace.route)
    }

    const pcb_trace = db.pcb_trace.insert({
      route: mergeRoutes(routes),
      source_trace_id: this.source_trace_id!,
    })
    this._portsRoutedOnPcb = ports
    this.pcb_trace_id = pcb_trace.pcb_trace_id
  }

  doInitialSchematicTraceRender(): void {
    const { db } = this.root!
    const { _parsedProps: props, parent } = this

    if (!parent) throw new Error("Trace has no parent")

    const { allPortsFound, portsWithSelectors: ports } =
      this._findConnectedPorts()

    if (!allPortsFound) return

    const obstacles: Obstacle[] = []
    const connection: SimpleRouteConnection = {
      name: this.source_trace_id!,
      pointsToConnect: [],
    }

    for (const elm of db.toArray()) {
      if (elm.type === "schematic_component") {
        obstacles.push({
          type: "rect",
          center: elm.center,
          width: elm.size.width,
          height: elm.size.height,
          connectedTo: [],
        })
      }
    }

    for (const { port } of ports) {
      connection.pointsToConnect.push(
        projectPointInDirection(
          port._getGlobalSchematicPositionBeforeLayout(),
          port.facingDirection!,
          0.1501,
        ),
      )
    }

    const bounds = computeObstacleBounds(obstacles)

    const simpleRouteJsonInput: SimpleRouteJson = {
      obstacles,
      connections: [connection],
      bounds,
      layerCount: 1,
    }

    const autorouter = new IJumpAutorouter({
      input: simpleRouteJsonInput,
    })
    const results = autorouter.solve()

    if (results.length === 0) return

    const [result] = results

    if (!result.solved) return

    const { route } = result

    const edges: SchematicTrace["edges"] = []

    for (let i = 0; i < route.length - 1; i++) {
      const from = route[i]
      const to = route[i + 1]

      edges.push({
        from,
        to,
        // TODO to_schematic_port_id and from_schematic_port_id
      })
    }

    const trace = db.schematic_trace.insert({
      source_trace_id: this.source_trace_id!,

      edges,
    })

    this.schematic_trace_id = trace.schematic_trace_id
  }
}
