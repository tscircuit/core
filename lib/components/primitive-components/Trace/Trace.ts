import { MultilayerIjump } from "@tscircuit/infgrid-ijump-astar"
import { traceProps } from "@tscircuit/props"
import {
  type LayerRef,
  type PcbTrace,
  type PcbTraceRoutePoint,
  type RouteHintPoint,
  type SchematicNetLabel,
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
import type { NetLabel } from "../NetLabel"
import type { Port } from "../Port"
import type { TraceHint } from "../TraceHint"
import type { TraceI } from "./TraceI"
import { getTraceLength } from "./compute-trace-length"
import { createSchematicTraceCrossingSegments } from "./create-schematic-trace-crossing-segments"
import { createSchematicTraceJunctions } from "./create-schematic-trace-junctions"
import { getMaxLengthFromConnectedCapacitors } from "./get-max-length-from-connected-capacitors"
import { getSchematicObstaclesForTrace } from "./get-obstacles-for-trace"
import { getOtherSchematicTraces } from "./get-other-schematic-traces"
import { getTraceDisplayName } from "./get-trace-display-name"
import { pushEdgesOfSchematicTraceToPreventOverlap } from "./push-edges-of-schematic-trace-to-prevent-overlap"
import { isRouteOutsideBoard } from "lib/utils/is-route-outside-board"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"
import { computeSchematicNetLabelCenter } from "lib/utils/schematic/computeSchematicNetLabelCenter"
import { Trace_doInitialSchematicTraceRender } from "./Trace_doInitialSchematicTraceRender"

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
        let parentSelector: string
        let portToken: string
        const dotIndex = selector.lastIndexOf(".")
        if (dotIndex !== -1 && dotIndex > selector.lastIndexOf(" ")) {
          parentSelector = selector.slice(0, dotIndex)
          portToken = selector.slice(dotIndex + 1)
        } else {
          const match = selector.match(/^(.*[ >])?([^ >]+)$/)
          parentSelector = match?.[1]?.trim() ?? ""
          portToken = match?.[2] ?? selector
        }
        let targetComponent = parentSelector
          ? this.getSubcircuit().selectOne(parentSelector)
          : null
        if (
          !targetComponent &&
          parentSelector &&
          !/[.#\[]/.test(parentSelector)
        ) {
          targetComponent = this.getSubcircuit().selectOne(`.${parentSelector}`)
        }
        if (!targetComponent) {
          if (parentSelector) {
            this.renderError(
              `Could not find port for selector "${selector}". Component "${parentSelector}" not found`,
            )
          } else {
            this.renderError(`Could not find port for selector "${selector}"`)
          }
        } else {
          const ports = targetComponent.children.filter(
            (c) => c.componentName === "Port",
          ) as Port[]
          const portLabel = portToken.includes(".")
            ? (portToken.split(".").pop() ?? "")
            : portToken
          const portNames = ports.map((c) => c.getNameAndAliases()).flat()
          const hasCustomLabels = portNames.some(
            (n) => !/^(pin\d+|\d+)$/.test(n),
          )
          const labelList = Array.from(new Set(portNames)).join(", ")
          let detail: string
          if (ports.length === 0) {
            detail = "It has no ports"
          } else if (!hasCustomLabels) {
            detail = `It has ${ports.length} pins and no pinLabels (consider adding pinLabels)`
          } else {
            detail = `It has [${labelList}]`
          }
          this.renderError(
            `Could not find port for selector "${selector}". Component "${targetComponent.props.name ?? parentSelector}" found, but does not have pin "${portLabel}". ${detail}`,
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

  _resolveNet(selector: string): Net | null {
    const direct = this.getSubcircuit().selectOne(selector, {
      type: "net",
    }) as Net | null
    if (direct) return direct

    // Fallback: search all descendants for a net with the same name
    const match = selector.match(/^net\.(.+)$/)
    const netName = match ? match[1] : null
    if (!netName) return null

    const allDescendants = this.root!._getBoard().getDescendants()
    return (
      (allDescendants.find(
        (d) => d.componentName === "Net" && d._parsedProps.name === netName,
      ) as Net | undefined) || null
    )
  }

  _findConnectedNets(): {
    nets: Net[]
    netsWithSelectors: Array<{ selector: string; net: Net }>
  } {
    const netsWithSelectors = this.getTracePathNetSelectors().map(
      (selector) => ({
        selector,
        net: this._resolveNet(selector) as Net,
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
    // TODO
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

    if (!existingToNetLabel) {
      const toSide =
        getEnteringEdgeFromDirection(toPort.facingDirection!) ?? "bottom"
      db.schematic_net_label.insert({
        text: this.props.schDisplayLabel! ?? pinFullName,
        source_net_id: toPort.source_port_id!,
        anchor_position: toAnchorPos,
        center: computeSchematicNetLabelCenter({
          anchor_position: toAnchorPos,
          anchor_side: toSide,
          text: this.props.schDisplayLabel! ?? pinFullName,
        }),
        anchor_side: toSide,
      })
    }
    if (!existingFromNetLabel) {
      const fromSide =
        getEnteringEdgeFromDirection(fromPort.facingDirection!) ?? "bottom"
      db.schematic_net_label.insert({
        text: this.props.schDisplayLabel! ?? pinFullName,
        source_net_id: fromPort.source_port_id!,
        anchor_position: fromAnchorPos,
        center: computeSchematicNetLabelCenter({
          anchor_position: fromAnchorPos,
          anchor_side: fromSide,
          text: this.props.schDisplayLabel! ?? pinFullName,
        }),
        anchor_side: fromSide,
      })
    }
  }

  _isSymbolToChipConnection(): boolean | undefined {
    const { allPortsFound, ports } = this._findConnectedPorts()
    if (!allPortsFound || ports.length !== 2) return false
    const [port1, port2] = ports
    if (!port1?.parent || !port2?.parent) return false
    const isPort1Chip = port1.parent.config.shouldRenderAsSchematicBox
    const isPort2Chip = port2.parent.config.shouldRenderAsSchematicBox
    return (isPort1Chip && !isPort2Chip) || (!isPort1Chip && isPort2Chip)
  }

  _isSymbolToSymbolConnection(): boolean | undefined {
    const { allPortsFound, ports } = this._findConnectedPorts()
    if (!allPortsFound || ports.length !== 2) return false
    const [port1, port2] = ports
    if (!port1?.parent || !port2?.parent) return false
    const isPort1Symbol = !port1.parent.config.shouldRenderAsSchematicBox
    const isPort2Symbol = !port2.parent.config.shouldRenderAsSchematicBox
    return isPort1Symbol && isPort2Symbol
  }
  _isChipToChipConnection(): boolean | undefined {
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
    Trace_doInitialSchematicTraceRender(this)
  }
}
