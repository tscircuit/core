import { silkscreenRectProps } from "@tscircuit/props"
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
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this

    const layer = props.layer ?? "top"
    if (layer !== "top" && layer !== "bottom") {
      throw new Error(
        `Invalid layer "${layer}" for SilkscreenRect. Must be "top" or "bottom".`,
      )
    }

    const subcircuit = this.getSubcircuit()

    const pcb_silkscreen_rect = db.pcb_silkscreen_rect.insert({
      pcb_component_id: this.parent?.pcb_component_id!,
      layer,
      center: {
        x: props.pcbX ?? 0,
        y: props.pcbY ?? 0,
      },
      width: props.width,
      height: props.height,
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
    })

    this.pcb_silkscreen_rect_id = pcb_silkscreen_rect.pcb_silkscreen_rect_id
  }
}
