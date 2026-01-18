import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { fabricationNoteTextProps } from "@tscircuit/props"
import { normalizeTextForCircuitJson } from "lib/utils/normalizeTextForCircuitJson"

export class FabricationNoteText extends PrimitiveComponent<
  typeof fabricationNoteTextProps
> {
  pcb_fabrication_note_text_id: string | null = null
  isPcbPrimitive = true

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
    const position = this._getGlobalPcbPositionBeforeLayout()
    const container = this.getPrimitiveContainer()!
    const subcircuit = this.getSubcircuit()
    const pcb_fabrication_note_text = db.pcb_fabrication_note_text.insert({
      anchor_alignment: props.anchorAlignment,
      anchor_position: {
        x: position.x,
        y: position.y,
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
    this.pcb_fabrication_note_text_id =
      pcb_fabrication_note_text.pcb_fabrication_note_text_id
  }

  getPcbSize(): { width: number; height: number } {
    const { _parsedProps: props } = this
    const fontSize =
      typeof props.fontSize === "string"
        ? parseFloat(props.fontSize)
        : (props.fontSize ?? 1)

    // Approximate the size based on the text length and font size
    const charWidth = fontSize * 0.6
    const width = (props.text ?? "").length * charWidth
    const height = fontSize

    return { width, height }
  }

  _moveCircuitJsonElements({
    deltaX,
    deltaY,
  }: { deltaX: number; deltaY: number }) {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!

    if (this.pcb_fabrication_note_text_id) {
      const text = db.pcb_fabrication_note_text.get(
        this.pcb_fabrication_note_text_id,
      )
      if (text) {
        db.pcb_fabrication_note_text.update(this.pcb_fabrication_note_text_id, {
          anchor_position: {
            x: text.anchor_position.x + deltaX,
            y: text.anchor_position.y + deltaY,
          },
        })
      }
    }
  }
}
