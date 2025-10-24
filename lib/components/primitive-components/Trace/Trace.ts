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
import { getMaxLengthFromConnectedCapacitors } from "./trace-utils/get-max-length-from-connected-capacitors"
import { getTraceDisplayName } from "./trace-utils/get-trace-display-name"
import { isRouteOutsideBoard } from "lib/utils/is-route-outside-board"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"
import { computeSchematicNetLabelCenter } from "lib/utils/schematic/computeSchematicNetLabelCenter"
import { Trace_doInitialSchematicTraceRender } from "./Trace_doInitialSchematicTraceRender"
import { Trace_doInitialPcbTraceRender } from "./Trace_doInitialPcbTraceRender"
import {
  Trace_doInitialPcbManualTraceRender,
  Trace_updatePcbManualTraceRender,
} from "./Trace_doInitialPcbManualTraceRender"
import { Trace__doInitialSchematicTraceRenderWithDisplayLabel } from "./Trace__doInitialSchematicTraceRenderWithDisplayLabel"
import { Trace__findConnectedPorts } from "./Trace__findConnectedPorts"
import { TraceConnectionError } from "../../../errors"

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
  _couldNotFindPort?: boolean

  constructor(props: z.input<typeof traceProps>) {
    super(props)
    this._portsRoutedOnPcb = []
  }

  /**
   * Get the explicit trace thickness, supporting 'width' as an alias for 'thickness'
   */
  _getExplicitTraceThickness(): number | undefined {
    return this._parsedProps.thickness ?? this._parsedProps.width
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
    return Trace__findConnectedPorts(this)
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

    const board = this.root?._getBoard()
    if (!board) {
      this.renderError(
        `Could not find a <board> ancestor for ${this}, so net "${selector}" cannot be resolved`,
      )
      return null
    }

    const allDescendants = board.getDescendants()
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

    let allPortsFound: boolean
    let ports: Array<{ selector: string; port: Port }>

    try {
      const result = this._findConnectedPorts()
      allPortsFound = result.allPortsFound
      ports = result.portsWithSelectors ?? []
    } catch (error) {
      if (error instanceof TraceConnectionError) {
        db.source_trace_not_connected_error.insert({
          ...error.errorData,
          error_type: "source_trace_not_connected_error",
        })
        this._couldNotFindPort = true
        return
      }
      throw error
    }

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
      min_trace_thickness: this._getExplicitTraceThickness(),
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

  doInitialPcbManualTraceRender(): void {
    Trace_doInitialPcbManualTraceRender(this)
  }

  updatePcbManualTraceRender(): void {
    Trace_updatePcbManualTraceRender(this)
  }

  doInitialPcbTraceRender(): void {
    Trace_doInitialPcbTraceRender(this)
  }

  _doInitialSchematicTraceRenderWithDisplayLabel(): void {
    Trace__doInitialSchematicTraceRenderWithDisplayLabel(this)
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
