import { silkscreenPathProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export class SilkscreenPath extends PrimitiveComponent<
  typeof silkscreenPathProps
> {
  pcb_silkscreen_path_id: string | null = null

  get config() {
    return {
      zodProps: silkscreenPathProps,
    }
  }

  doInitialPcbPrimitiveRender(): void {
    const { db } = this.project!
    const { _parsedProps: props } = this

    const layer = props.layer ?? "top"
    if (layer !== "top" && layer !== "bottom") {
      throw new Error(
        `Invalid layer "${layer}" for SilkscreenPath. Must be "top" or "bottom".`,
      )
    }

    const pcb_silkscreen_path = db.pcb_silkscreen_path.insert({
      pcb_component_id: this.parent?.pcb_component_id!,
      layer,
      route: props.route,
      stroke_width: props.strokeWidth ?? 0.1,
    })

    this.pcb_silkscreen_path_id = pcb_silkscreen_path.pcb_silkscreen_path_id
  }
}
