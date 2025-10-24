import { fabricationNotePathProps } from "@tscircuit/props"
import { convertColorName } from "lib/utils/colors/convert-color-name"
import { applyToPoint } from "transformation-matrix"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export class FabricationNotePath extends PrimitiveComponent<
  typeof fabricationNotePathProps
> {
  fabrication_note_path_id: string | null = null

  get config() {
    return {
      componentName: "FabricationNotePath",
      zodProps: fabricationNotePathProps,
    }
  }

  doInitialPcbPrimitiveRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const subcircuit = this.getSubcircuit()
    const { _parsedProps: props } = this

    const layer = props.layer ?? "top"
    if (layer !== "top" && layer !== "bottom") {
      throw new Error(
        `Invalid layer "${layer}" for SilkscreenPath. Must be "top" or "bottom".`,
      )
    }

    const transform = this._computePcbGlobalTransformBeforeLayout()

    const pcb_component_id =
      this.parent?.pcb_component_id ??
      this.getPrimitiveContainer()?.pcb_component_id!
    const fabrication_note_path = db.pcb_fabrication_note_path.insert({
      pcb_component_id,
      layer,
      color: props.color ? convertColorName(props.color) : undefined,
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
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
    })

    this.fabrication_note_path_id =
      fabrication_note_path.pcb_fabrication_note_path_id
  }
}
