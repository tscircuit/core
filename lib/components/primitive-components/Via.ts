import { viaProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { Port } from "./Port"
import type { LayerRef, PcbVia } from "circuit-json"
import { z } from "zod"
import type { Net } from "./Net"
import type { Trace } from "./Trace/Trace"

const viaPropsWithDefaults = viaProps.extend({
  outerDiameter: viaProps.shape.outerDiameter.default(0.6),
  holeDiameter: viaProps.shape.holeDiameter.default(0.3),
})

export class Via extends PrimitiveComponent<typeof viaPropsWithDefaults> {
  pcb_via_id: string | null = null
  matchedPort: Port | null = null
  isPcbPrimitive = true
  source_manually_placed_via_id: string | null = null
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
      zodProps: viaPropsWithDefaults,
    }
  }

  getAvailablePcbLayers(): string[] {
    // TODO use project layerCount
    return ["top", "inner1", "inner2", "bottom"]
  }

  getPcbSize(): { width: number; height: number } {
    const { _parsedProps: props } = this
    return { width: props.outerDiameter, height: props.outerDiameter }
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
    if (fromLayer === toLayer) return [fromLayer]
    // TODO calculate layers inbetween top and bottom using layer count
    return [fromLayer, toLayer]
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
    if (!connectsTo) return null

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
  doInitialPcbComponentRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this
    const position = this._getGlobalPcbPositionBeforeLayout()
    const subcircuit = this.getSubcircuit()
    const pcb_component = db.pcb_component.insert({
      center: position,
      width: props.outerDiameter,
      height: props.outerDiameter,
      layer: props.fromLayer ?? "top",
      rotation: 0,
      source_component_id: this.source_component_id!,
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      obstructs_within_bounds: true,
    })
    this.pcb_component_id = pcb_component.pcb_component_id
  }
  doInitialSourceRender(): void {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const group = this.getGroup()
    const subcircuit = this.getSubcircuit()

    const source_via = db.source_manually_placed_via.insert({
      source_group_id: group?.source_group_id!,
      source_net_id: (props as any).net ?? "",
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
    })

    this.source_component_id = source_via.source_manually_placed_via_id
  }
  doInitialPcbPrimitiveRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this
    const position = this._getGlobalPcbPositionBeforeLayout()
    const subcircuit = this.getSubcircuit()
    const pcb_via = db.pcb_via.insert({
      x: position.x,
      y: position.y,
      hole_diameter: props.holeDiameter,
      outer_diameter: props.outerDiameter,
      layers: ["bottom", "top"],
      from_layer: props.fromLayer || "bottom",
      to_layer: props.toLayer || "top",
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      subcircuit_connectivity_map_key:
        this.subcircuit_connectivity_map_key ?? undefined,
      pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
      net_is_assignable: props.netIsAssignable ?? undefined,
    } as Omit<PcbVia & { net_is_assignable?: boolean }, "type" | "pcb_via_id">)
    this.pcb_via_id = pcb_via.pcb_via_id
  }
}
