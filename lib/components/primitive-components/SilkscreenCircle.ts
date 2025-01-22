import { silkscreenCircleProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export class SilkscreenCircle extends PrimitiveComponent<
  typeof silkscreenCircleProps
> {
  pcb_silkscreen_circle_id: string | null = null

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
    const layer = props.layer ?? "top"
    if (layer !== "top" && layer !== "bottom") {
      throw new Error(
        `Invalid layer "${layer}" for SilkscreenCircle. Must be "top" or "bottom".`,
      )
    }

    const transform = this._computePcbGlobalTransformBeforeLayout()
    const subcircuit = this.getSubcircuit()

    const pcb_silkscreen_circle = db.pcb_silkscreen_circle.insert({
      pcb_component_id: this.parent?.pcb_component_id!,
      layer,
      center: {
        x: props.pcbX ?? 0,
        y: props.pcbY ?? 0,
      },
      radius: props.radius,
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
    })

    this.pcb_silkscreen_circle_id =
      pcb_silkscreen_circle.pcb_silkscreen_circle_id
  }
}
