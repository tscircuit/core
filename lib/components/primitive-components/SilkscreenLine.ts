import { silkscreenLineProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export class SilkscreenLine extends PrimitiveComponent<
  typeof silkscreenLineProps
> {
  pcb_silkscreen_line_id: string | null = null

  get config() {
    return {
      componentName: "SilkscreenLine",
      zodProps: silkscreenLineProps,
    }
  }

  doInitialPcbPrimitiveRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this
    const layer = props.layer ?? "top"
    if (layer !== "top" && layer !== "bottom") {
      throw new Error(
        `Invalid layer "${layer}" for SilkscreenLine. Must be "top" or "bottom".`,
      )
    }
    const subcircuit = this.getSubcircuit()

    const pcb_silkscreen_line = db.pcb_silkscreen_line.insert({
      pcb_component_id: this.parent?.pcb_component_id!,
      layer,
      x1: props.x1,
      y1: props.y1,
      x2: props.x2,
      y2: props.y2,
      stroke_width: props.strokeWidth ?? 0.1,
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
    })

    this.pcb_silkscreen_line_id = pcb_silkscreen_line.pcb_silkscreen_line_id
  }
}
