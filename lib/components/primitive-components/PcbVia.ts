import { commonLayoutProps } from "@tscircuit/props"
import {
  distance,
  layer_ref,
  type LayerRef,
  type PcbVia as CircuitJsonPcbVia,
} from "circuit-json"
import { z } from "zod"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export const pcbViaProps = commonLayoutProps.extend({
  holeDiameter: distance.optional(),
  outerDiameter: distance.optional(),
  fromLayer: layer_ref.optional(),
  toLayer: layer_ref.optional(),
  layers: z.array(layer_ref).optional(),
  pcbTraceId: z.string().optional(),
  netIsAssignable: z.boolean().optional(),
  netAssigned: z.boolean().optional(),
  isTented: z.boolean().optional(),
})

export type PcbViaProps = z.infer<typeof pcbViaProps>

export class PcbVia extends PrimitiveComponent<typeof pcbViaProps> {
  pcb_via_id: string | null = null
  isPcbPrimitive = true

  get config() {
    return {
      componentName: "PcbVia",
      zodProps: pcbViaProps,
    }
  }

  private _getLayers(): LayerRef[] {
    const { layers, fromLayer = "top", toLayer = "bottom" } = this._parsedProps
    if (layers && layers.length > 0) return layers as LayerRef[]
    if (fromLayer === toLayer) return [fromLayer as LayerRef]
    return [fromLayer as LayerRef, toLayer as LayerRef]
  }

  getAvailablePcbLayers(): string[] {
    return this._getLayers()
  }

  getPcbSize(): { width: number; height: number } {
    const outerDiameter = this._parsedProps.outerDiameter ?? 0.6
    return { width: outerDiameter, height: outerDiameter }
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

  doInitialPcbPrimitiveRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const {
      holeDiameter,
      outerDiameter,
      pcbTraceId,
      netIsAssignable,
      netAssigned,
      isTented,
    } = this._parsedProps
    const subcircuit = this.getSubcircuit()
    const position = this._getGlobalPcbPositionBeforeLayout()
    const { maybeFlipLayer } = this._getPcbPrimitiveFlippedHelpers()
    const layers = this._getLayers().map((layer) =>
      maybeFlipLayer(layer),
    ) as LayerRef[]
    const fromLayer = this._parsedProps.fromLayer
      ? maybeFlipLayer(this._parsedProps.fromLayer as LayerRef)
      : layers[0]
    const toLayer = this._parsedProps.toLayer
      ? maybeFlipLayer(this._parsedProps.toLayer as LayerRef)
      : (layers[layers.length - 1] ?? fromLayer)

    const pcbVia = db.pcb_via.insert({
      x: position.x,
      y: position.y,
      ...(holeDiameter !== undefined ? { hole_diameter: holeDiameter } : {}),
      ...(outerDiameter !== undefined ? { outer_diameter: outerDiameter } : {}),
      layers,
      from_layer: fromLayer,
      to_layer: toLayer,
      pcb_trace_id: pcbTraceId,
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
      net_is_assignable: netIsAssignable,
      net_assigned: netAssigned,
      is_tented: isTented,
    } as Omit<CircuitJsonPcbVia, "type" | "pcb_via_id">)

    this.pcb_via_id = pcbVia.pcb_via_id
  }
}
