import { silkscreenRectProps } from "@tscircuit/props"
import { applyToPoint } from "transformation-matrix"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export class SilkscreenRect extends PrimitiveComponent<
  typeof silkscreenRectProps
> {
  pcb_silkscreen_rect_id: string | null = null

  get config() {
    return {
      componentName: "SilkscreenRect",
      zodProps: silkscreenRectProps,
    }
  }

  doInitialPcbPrimitiveRender(): void {
    const { db } = this.root!
    const { _parsedProps: props } = this

    const layer = props.layer ?? "top"
    if (layer !== "top" && layer !== "bottom") {
      throw new Error(
        `Invalid layer "${layer}" for SilkscreenRect. Must be "top" or "bottom".`,
      )
    }

    const transform = this._computePcbGlobalTransformBeforeLayout()
    const transformedCenter = applyToPoint(transform, {
      x: props.pcbX ?? 0,
      y: props.pcbY ?? 0,
    })

    const pcb_silkscreen_rect = db.pcb_silkscreen_rect.insert({
      pcb_component_id: this.parent?.pcb_component_id!,
      layer,
      center: {
        x: transformedCenter.x,
        y: transformedCenter.y,
      },
      width: props.width,
      height: props.height,
    })

    this.pcb_silkscreen_rect_id = pcb_silkscreen_rect.pcb_silkscreen_rect_id
  }
}
