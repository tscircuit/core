import { fabricationNoteTextProps } from "@tscircuit/props"
import { convertColorName } from "lib/utils/colors"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export class FabricationNoteText extends PrimitiveComponent<
  typeof fabricationNoteTextProps
> {
  get config() {
    return {
      componentName: "FabricationNoteText",
      zodProps: fabricationNoteTextProps,
    }
  }

  doInitialPcbPrimitiveRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this
    const container = this.getPrimitiveContainer()!
    const subcircuit = this.getSubcircuit()
    db.pcb_fabrication_note_text.insert({
      anchor_alignment: props.anchorAlignment,
      anchor_position: {
        x: props.pcbX ?? 0,
        y: props.pcbY ?? 0,
      },
      font: props.font ?? "tscircuit2024",
      font_size: props.fontSize ?? 1,
      layer: "top",
      color: props.color ? convertColorName(props.color) : undefined,
      text: props.text ?? "",
      pcb_component_id: container.pcb_component_id!,
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
    })
  }
}
