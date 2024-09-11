import { fabricationNotePathProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { applyToPoint } from "transformation-matrix"

export class FabricationNotePath extends PrimitiveComponent<
  typeof fabricationNotePathProps
> {
  fabrication_note_path_id: string | null = null

  get config() {
    return {
      zodProps: fabricationNotePathProps,
    }
  }

  doInitialPcbPrimitiveRender(): void {
    const { db } = this.root!
    const { _parsedProps: props } = this

    const layer = props.layer ?? "top"
    if (layer !== "top" && layer !== "bottom") {
      throw new Error(
        `Invalid layer "${layer}" for SilkscreenPath. Must be "top" or "bottom".`,
      )
    }

    const transform = this._computePcbGlobalTransformBeforeLayout()

    const fabrication_note_path = db.pcb_fabrication_note_path.insert({
      pcb_component_id: this.parent?.pcb_component_id!,
      layer,
      route: props.route.map((p) => {
        const transformedPosition = applyToPoint(transform, {
          x: p.x,
          y: p.y,
        })
        return {
          ...p,
          x: transformedPosition.x,
          y: transformedPosition.y,
        }
      }),
      stroke_width: props.strokeWidth ?? 0.1,
      fabrication_note_path_id: `fabrication_note_${Math.random().toString()}`,
    })

    this.fabrication_note_path_id =
      fabrication_note_path.fabrication_note_path_id
  }
}
