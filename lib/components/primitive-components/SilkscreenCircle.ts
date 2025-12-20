import { silkscreenCircleProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export class SilkscreenCircle extends PrimitiveComponent<
  typeof silkscreenCircleProps
> {
  pcb_silkscreen_circle_id: string | null = null
  isPcbPrimitive = true

  get config() {
    return {
      componentName: "SilkscreenCircle",
      zodProps: silkscreenCircleProps,
    }
  }

  doInitialPcbPrimitiveRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this
    const { pcbX, pcbY } = this.getResolvedPcbPositionProp()
    const { maybeFlipLayer } = this._getPcbPrimitiveFlippedHelpers()
    const layer = maybeFlipLayer(props.layer ?? "top") as "top" | "bottom"

    if (layer !== "top" && layer !== "bottom") {
      throw new Error(
        `Invalid layer "${layer}" for SilkscreenCircle. Must be "top" or "bottom".`,
      )
    }

    const transform = this._computePcbGlobalTransformBeforeLayout()
    const subcircuit = this.getSubcircuit()

    const pcb_component_id =
      this.parent?.pcb_component_id ??
      this.getPrimitiveContainer()?.pcb_component_id!
    const pcb_silkscreen_circle = db.pcb_silkscreen_circle.insert({
      pcb_component_id,
      layer,
      center: {
        x: pcbX,
        y: pcbY,
      },
      radius: props.radius,
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
      stroke_width: props.strokeWidth ?? 0.1,
    })

    this.pcb_silkscreen_circle_id =
      pcb_silkscreen_circle.pcb_silkscreen_circle_id
  }

  getPcbSize(): { width: number; height: number } {
    const { _parsedProps: props } = this
    const diameter = props.radius * 2
    return { width: diameter, height: diameter }
  }

  _repositionOnPcb({ deltaX, deltaY }: { deltaX: number; deltaY: number }) {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    if (!this.pcb_silkscreen_circle_id) return

    const circle = db.pcb_silkscreen_circle.get(this.pcb_silkscreen_circle_id)
    if (circle) {
      db.pcb_silkscreen_circle.update(this.pcb_silkscreen_circle_id, {
        center: {
          x: circle.center.x + deltaX,
          y: circle.center.y + deltaY,
        },
      })
    }
  }
}
