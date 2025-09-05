import { viaProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { Port } from "./Port"
import type { LayerRef } from "circuit-json"
import { z } from "zod"

export class Via extends PrimitiveComponent<typeof viaProps> {
  pcb_via_id: string | null = null
  source_manually_placed_via_id: string | null = null
  matchedPort: Port | null = null
  isPcbPrimitive = true

  constructor(props: z.input<typeof viaProps>) {
    super(props)
    const layers = this._getLayers()
    for (const layer of layers) {
      const port = new Port({ name: layer })
      port.matchedComponents.push(this)
      // Restrict available layer for this port to the via layer
      port.getAvailablePcbLayers = () => [layer] as LayerRef[]
      this.add(port)
    }
  }

  get config() {
    return {
      componentName: "Via",
      zodProps: viaProps,
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
    return [fromLayer, toLayer]
  }

  doInitialSourceRender(): void {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const position = this._getGlobalPcbPositionBeforeLayout()
    const group = this.getGroup()
    const subcircuit = this.getSubcircuit()
    const layers = this._getLayers()

    const source_via = db.source_manually_placed_via.insert({
      source_group_id: group?.source_group_id!,
      source_net_id: (props as any).net ?? "",
      x: position.x,
      y: position.y,
      layers,
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
    })

    this.source_manually_placed_via_id =
      source_via.source_manually_placed_via_id
    // Use source_manually_placed_via_id to satisfy Port's expectation
    this.source_component_id = this.source_manually_placed_via_id
    this.source_group_id = group?.source_group_id ?? null
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
      pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
    })

    this.pcb_via_id = pcb_via.pcb_via_id
  }
}
