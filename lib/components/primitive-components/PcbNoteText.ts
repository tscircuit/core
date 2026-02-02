import { pcbNoteTextProps } from "@tscircuit/props"
import { normalizeTextForCircuitJson } from "lib/utils/normalizeTextForCircuitJson"
import { applyToPoint } from "transformation-matrix"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

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

    // Insert error if text is empty or undefined
    if (!props.text) {
      const subcircuit = this.getSubcircuit()
      db.source_missing_property_error.insert({
        error_type: "source_missing_property_error",
        source_component_id:
          this.source_component_id ??
          this.getParentNormalComponent()?.source_component_id ??
          "",
        property_name: "text",
        message: `pcb_note_text requires a non-empty "text" property`,
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      })
      return
    }

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
    const text = props.text ?? ""
    const width = text.length * charWidth
    const height = fontSize

    return { width, height }
  }

  _moveCircuitJsonElements({
    deltaX,
    deltaY,
  }: { deltaX: number; deltaY: number }) {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    if (!this.pcb_note_text_id) return

    const text = db.pcb_note_text.get(this.pcb_note_text_id)
    if (text) {
      db.pcb_note_text.update(this.pcb_note_text_id, {
        anchor_position: {
          x: text.anchor_position.x + deltaX,
          y: text.anchor_position.y + deltaY,
        },
      })
    }
  }
}
