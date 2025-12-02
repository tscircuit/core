import { pcbNoteTextProps } from "@tscircuit/props"
import { applyToPoint } from "transformation-matrix"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { normalizeTextForCircuitJson } from "lib/utils/normalizeTextForCircuitJson"

export class PcbNoteText extends PrimitiveComponent<typeof pcbNoteTextProps> {
  pcb_note_text_id: string | null = null
  isPcbPrimitive = true

  get config() {
    return {
      componentName: "PcbNoteText",
      zodProps: pcbNoteTextProps,
    }
  }

  doInitialPcbPrimitiveRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this
    const transform = this._computePcbGlobalTransformBeforeLayout()
    const anchorPosition = applyToPoint(transform, { x: 0, y: 0 })
    const subcircuit = this.getSubcircuit()
    const group = this.getGroup()

    const pcb_component_id =
      this.parent?.pcb_component_id ??
      this.getPrimitiveContainer()?.pcb_component_id ??
      undefined

    const pcb_note_text = db.pcb_note_text.insert({
      pcb_component_id,
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      pcb_group_id: group?.pcb_group_id ?? undefined,
      font: props.font ?? "tscircuit2024",
      font_size: props.fontSize ?? 1,
      text: normalizeTextForCircuitJson(props.text),
      anchor_position: anchorPosition,
      anchor_alignment: props.anchorAlignment ?? "center",
      color: props.color,
    })

    this.pcb_note_text_id = pcb_note_text.pcb_note_text_id
  }

  getPcbSize(): { width: number; height: number } {
    const { _parsedProps: props } = this
    const fontSize =
      typeof props.fontSize === "string"
        ? parseFloat(props.fontSize)
        : (props.fontSize ?? 1)

    // Approximate the size based on the text length and font size
    const charWidth = fontSize * 0.6
    const width = props.text.length * charWidth
    const height = fontSize

    return { width, height }
  }
}
