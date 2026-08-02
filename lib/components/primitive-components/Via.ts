import { type PcbStyle, viaProps } from "@tscircuit/props"
import type { LayerRef, PcbVia } from "circuit-json"
import { createNetsFromProps } from "lib/utils/components/createNetsFromProps"
import { getViaSpanLayers } from "lib/utils/getViaSpanLayers"
import { getViaDiameterDefaultsWithOverrides } from "lib/utils/pcbStyle/getViaDiameterDefaults"
import { z } from "zod"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { Net } from "./Net"
import { Port } from "./Port"
import { isPcbPrimitiveContainedWithinBeforeRender } from "./Port/pcbPrimitiveOverlapBeforeRender"
import type { SmtPad } from "./SmtPad"
import type { Trace } from "./Trace/Trace"
export class Via extends PrimitiveComponent<typeof viaProps> {
  pcb_via_id: string | null = null
  matchedPort: Port | null = null
  isPcbPrimitive = true
  source_manually_placed_via_id: string | null = null
  source_trace_id: string | null = null
  subcircuit_connectivity_map_key: string | null = null

  constructor(props: z.input<typeof viaProps>) {
    super(props)
    const layers = this._getLayers()
    ;(this._parsedProps as any).layers = layers
    this.initPorts()
  }
  get config() {
    return {
      componentName: "Via",
      zodProps: viaProps,
    }
  }

  getAvailablePcbLayers(): LayerRef[] {
    return this._getLayers()
  }

  private _getResolvedViaDiameters(pcbStyle?: PcbStyle) {
    return getViaDiameterDefaultsWithOverrides(
      {
        holeDiameter: this._parsedProps.holeDiameter,
        padDiameter: this._parsedProps.outerDiameter,
      },
      pcbStyle,
    )
  }

  getPcbSize(): { width: number; height: number } {
    const pcbStyle = this.getInheritedMergedProperty("pcbStyle") as
      | PcbStyle
      | undefined
    const { padDiameter } = this._getResolvedViaDiameters(pcbStyle)
    return { width: padDiameter, height: padDiameter }
  }

  _getPcbCircuitJsonBounds(): {
    center: { x: number; y: number }
    bounds: { left: number; top: number; right: number; bottom: number }
    width: number
    height: number
  } {
    const { db } = this.root!
    const via = db.pcb_via.get(this.pcb_via_id!)!
    const size = this.getPcbSize()

    return {
      center: { x: via.x, y: via.y },
      bounds: {
        left: via.x - size.width / 2,
        top: via.y - size.height / 2,
        right: via.x + size.width / 2,
        bottom: via.y + size.height / 2,
      },
      width: size.width,
      height: size.height,
    }
  }

  _setPositionFromLayout(newCenter: { x: number; y: number }) {
    const { db } = this.root!
    db.pcb_via.update(this.pcb_via_id!, {
      x: newCenter.x,
      y: newCenter.y,
    })
  }
  _getLayers(): LayerRef[] {
    const { fromLayer = "top", toLayer = "bottom" } = this._parsedProps
    // Before the via is attached to the tree (constructor/port init) the board
    // layer count is unknown — fall back to 2, which yields [fromLayer, toLayer].
    const layerCount = this.parent
      ? this.getSubcircuit()._getSubcircuitLayerCount()
      : 2
    return getViaSpanLayers({ fromLayer, toLayer, layerCount })
  }

  initPorts() {
    const layers = (this._parsedProps as any).layers as LayerRef[]
    for (const layer of layers) {
      const port = new Port({ name: layer, layer })
      port.registerMatch(this)
      this.add(port)
    }
    const port = new Port({ name: "pin1" })
    port.registerMatch(this)
    this.add(port)
  }

  /**
   * Find the Net or Trace that this via is connected to
   */
  _getConnectedNetOrTrace(): Net | Trace | null {
    const connectsTo = this._parsedProps.connectsTo
    if (!connectsTo) {
      return (
        this._getPortFromContainingPad()?._getDirectlyConnectedTraces()[0] ??
        null
      )
    }

    const subcircuit = this.getSubcircuit()
    const selectors = Array.isArray(connectsTo) ? connectsTo : [connectsTo]

    for (const selector of selectors) {
      if (selector.startsWith("net.")) {
        // Find the net
        const net = subcircuit.selectOne(selector, {
          type: "net",
        }) as Net | null
        if (net) return net
      }
    }

    return null
  }

  doInitialCreateNetsFromProps(): void {
    const connectsTo = this._parsedProps.connectsTo
    if (!connectsTo) return

    createNetsFromProps(
      this,
      Array.isArray(connectsTo) ? connectsTo : [connectsTo],
    )
  }

  private _getPortFromContainingPad(): Port | null {
    if (this.parent?.componentName !== "Footprint") return null

    const containingPadPorts = new Set(
      this.parent.children
        .filter((child): child is SmtPad => child.componentName === "SmtPad")
        .filter((pad) => isPcbPrimitiveContainedWithinBeforeRender(this, pad))
        .map((pad) => pad.matchedPort)
        .filter((port): port is Port => port !== null),
    )

    return containingPadPorts.size === 1 ? [...containingPadPorts][0] : null
  }

  doInitialPcbComponentRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const pcbStyle = this.getInheritedMergedProperty("pcbStyle") as
      | PcbStyle
      | undefined
    const { padDiameter } = this._getResolvedViaDiameters(pcbStyle)
    const position = this._getGlobalPcbPositionBeforeLayout()
    const subcircuit = this.getSubcircuit()
    const pcb_component = db.pcb_component.insert({
      center: position,
      width: padDiameter,
      height: padDiameter,
      layer: this._parsedProps.fromLayer ?? "top",
      rotation: 0,
      source_component_id: this.source_component_id!,
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      obstructs_within_bounds: true,
    })
    this.pcb_component_id = pcb_component.pcb_component_id
  }
  doInitialSourceRender(): void {
    const { db } = this.root!
    const group = this.getGroup()
    const subcircuit = this.getSubcircuit()

    const source_via = db.source_manually_placed_via.insert({
      source_group_id: group?.source_group_id!,
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
    })

    this.source_manually_placed_via_id =
      source_via.source_manually_placed_via_id
    this.source_component_id = source_via.source_manually_placed_via_id
  }

  doInitialSourceTraceRender(): void {
    const connectsTo = this._parsedProps.connectsTo
    if (!connectsTo) return

    const { db } = this.root!
    const subcircuit = this.getSubcircuit()
    const selectors = Array.isArray(connectsTo) ? connectsTo : [connectsTo]
    const connectedPorts: Port[] = []
    const connectedNets: Net[] = []

    for (const selector of selectors) {
      if (selector.startsWith("net.")) {
        const net = subcircuit.selectOne(selector, {
          type: "net",
        }) as Net | null
        if (!net?.source_net_id) {
          this.renderError(`Could not find net for via selector "${selector}"`)
          return
        }
        connectedNets.push(net)
        continue
      }

      const port =
        (subcircuit.selectOne(selector, { type: "port" }) as Port | null) ??
        this.getParentNormalComponent()?.children.find(
          (child: PrimitiveComponent): child is Port =>
            child instanceof Port && child.isMatchingAnyOf([selector]),
        ) ??
        null
      if (!port?.source_port_id) {
        this.renderError(`Could not find port for via selector "${selector}"`)
        return
      }
      connectedPorts.push(port)
    }

    if (connectedPorts.length > 0) {
      const sourceTrace = db.source_trace.insert({
        connected_source_port_ids: connectedPorts.map(
          (port) => port.source_port_id!,
        ),
        connected_source_net_ids: connectedNets.map(
          (net) => net.source_net_id!,
        ),
        subcircuit_id: subcircuit.subcircuit_id ?? undefined,
        display_name: this._parsedProps.name
          ? `${this._parsedProps.name} connectivity`
          : "Manually placed via connectivity",
      })
      this.source_trace_id = sourceTrace.source_trace_id
    }

    db.source_manually_placed_via.update(this.source_manually_placed_via_id!, {
      source_net_id: connectedNets[0]?.source_net_id,
      source_trace_id: this.source_trace_id ?? undefined,
    })
  }

  doInitialPcbPrimitiveRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const pcbStyle = this.getInheritedMergedProperty("pcbStyle") as
      | PcbStyle
      | undefined
    const { holeDiameter, padDiameter } =
      this._getResolvedViaDiameters(pcbStyle)
    const position = this._getGlobalPcbPositionBeforeLayout()
    const subcircuit = this.getSubcircuit()
    const connectedNetOrTrace = this._getConnectedNetOrTrace()
    const sourceTraceId =
      this.source_trace_id ??
      (connectedNetOrTrace instanceof Net
        ? undefined
        : connectedNetOrTrace?.source_trace_id)
    const sourceNetId =
      !sourceTraceId && connectedNetOrTrace instanceof Net
        ? connectedNetOrTrace.source_net_id
        : undefined
    const pcb_via = db.pcb_via.insert({
      x: position.x,
      y: position.y,
      hole_diameter: holeDiameter,
      outer_diameter: padDiameter,
      layers: this._getLayers(),
      from_layer: this._parsedProps.fromLayer || "bottom",
      to_layer: this._parsedProps.toLayer || "top",
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      subcircuit_connectivity_map_key:
        this.subcircuit_connectivity_map_key ?? undefined,
      pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
      net_is_assignable: this._parsedProps.netIsAssignable ?? undefined,
      ...(sourceTraceId ? { source_trace_id: sourceTraceId } : {}),
      ...(sourceNetId ? { source_net_id: sourceNetId } : {}),
    } as Omit<PcbVia & { net_is_assignable?: boolean }, "type" | "pcb_via_id">)
    this.pcb_via_id = pcb_via.pcb_via_id
  }
}
