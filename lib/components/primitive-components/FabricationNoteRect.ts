import { fabricationNoteRectProps } from "@tscircuit/props"
import { applyToPoint } from "transformation-matrix"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export class FabricationNoteRect extends PrimitiveComponent<
  typeof fabricationNoteRectProps
> {
  fabrication_note_rect_id: string | null = null

  get config() {
    return {
      componentName: "FabricationNoteRect",
      zodProps: fabricationNoteRectProps,
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
        `Invalid layer "${layer}" for FabricationNoteRect. Must be "top" or "bottom".`,
      )
    }

    const pcb_component_id =
      this.parent?.pcb_component_id ??
      this.getPrimitiveContainer()?.pcb_component_id!

    const subcircuit = this.getSubcircuit()

    const hasStroke =
      props.hasStroke ??
      (props.strokeWidth !== undefined && props.strokeWidth !== null)

    const fabrication_note_rect = db.pcb_fabrication_note_rect.insert({
      pcb_component_id,
      layer,
      color: props.color,

      center: {
        x: props.pcbX ?? 0,
        y: props.pcbY ?? 0,
      },
      width: props.width,
      height: props.height,
      stroke_width: props.strokeWidth ?? 1,
      is_filled: props.isFilled ?? false,
      has_stroke: hasStroke,
      is_stroke_dashed: props.isStrokeDashed ?? false,
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
      corner_radius: props.cornerRadius ?? undefined,
    })

    this.fabrication_note_rect_id =
      fabrication_note_rect.pcb_fabrication_note_rect_id
  }

  getPcbSize(): { width: number; height: number } {
    const { _parsedProps: props } = this
    return { width: props.width, height: props.height }
  }
}
