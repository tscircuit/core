import { silkscreenRectProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export class SilkscreenRect extends PrimitiveComponent<
  typeof silkscreenRectProps
> {
  pcb_silkscreen_rect_id: string | null = null
  isPcbPrimitive = true

  get config() {
    return {
      componentName: "SilkscreenRect",
      zodProps: silkscreenRectProps,
    }
  }

  doInitialPcbPrimitiveRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this
    const { maybeFlipLayer } = this._getPcbPrimitiveFlippedHelpers()
    const layer = maybeFlipLayer(props.layer ?? "top") as "top" | "bottom"

    if (layer !== "top" && layer !== "bottom") {
      throw new Error(
        `Invalid layer "${layer}" for SilkscreenRect. Must be "top" or "bottom".`,
      )
    }

    const subcircuit = this.getSubcircuit()

    const pcb_component_id =
      this.parent?.pcb_component_id ??
      this.getPrimitiveContainer()?.pcb_component_id!
    const pcb_silkscreen_rect = db.pcb_silkscreen_rect.insert({
      pcb_component_id,
      layer,
      center: {
        x: props.pcbX ?? 0,
        y: props.pcbY ?? 0,
      },
      width: props.width,
      height: props.height,
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      pcb_group_id: this?.getGroup()?.pcb_group_id ?? undefined,
      stroke_width: props.strokeWidth ?? 0.1,
      is_filled: props.filled ?? false,
      corner_radius: props.cornerRadius ?? undefined,
    })

    this.pcb_silkscreen_rect_id = pcb_silkscreen_rect.pcb_silkscreen_rect_id
  }

  getPcbSize(): { width: number; height: number } {
    const { _parsedProps: props } = this
    return { width: props.width, height: props.height }
  }
}
