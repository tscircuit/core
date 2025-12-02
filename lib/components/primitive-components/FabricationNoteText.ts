import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { fabricationNoteTextProps } from "@tscircuit/props"
import { normalizeTextForCircuitJson } from "lib/utils/normalizeTextForCircuitJson"

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
    const { pcbX, pcbY } = this.getResolvedPcbPositionProp()
    const container = this.getPrimitiveContainer()!
    const subcircuit = this.getSubcircuit()
    db.pcb_fabrication_note_text.insert({
      anchor_alignment: props.anchorAlignment,
      anchor_position: {
        x: pcbX,
        y: pcbY,
      },
      font: props.font ?? "tscircuit2024",
      font_size: props.fontSize ?? 1,
      layer: "top",
      color: props.color,
      text: normalizeTextForCircuitJson(props.text ?? ""),
      pcb_component_id: container.pcb_component_id!,
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
    })
  }
}
