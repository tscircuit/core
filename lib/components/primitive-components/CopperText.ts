import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { normalizeTextForCircuitJson } from "lib/utils/normalizeTextForCircuitJson"
import { copperTextProps } from "@tscircuit/props"

export class CopperText extends PrimitiveComponent<typeof copperTextProps> {
  isPcbPrimitive = true
  pcb_copper_text_id: string | null = null

  get config() {
    return {
      componentName: "CopperText",
      zodProps: copperTextProps,
    }
  }

  doInitialPcbPrimitiveRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this
    const container = this.getPrimitiveContainer()!
    const position = this._getGlobalPcbPositionBeforeLayout()
    const subcircuit = this.getSubcircuit()

    const pcb_copper_text = db.pcb_copper_text.insert({
      anchor_alignment: props.anchorAlignment,
      anchor_position: {
        x: position.x,
        y: position.y,
      },
      font: "tscircuit2024",
      font_size: props.fontSize!,
      layer: props.layer ?? "top",
      text: normalizeTextForCircuitJson(props.text),
      ccw_rotation: props.pcbRotation,
      is_mirrored: props.mirrored,
      is_knockout: props.knockout,
      pcb_component_id: container.pcb_component_id!,
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
    })
    this.pcb_copper_text_id = pcb_copper_text.pcb_copper_text_id
  }

  getPcbSize(): { width: number; height: number } {
    const { _parsedProps: props } = this
    const fontSize = props.fontSize ?? 1
    const text = props.text ?? ""
    const textWidth = text.length * fontSize
    const textHeight = fontSize
    return { width: textWidth * fontSize, height: textHeight * fontSize }
  }

  _moveCircuitJsonElements({
    deltaX,
    deltaY,
  }: { deltaX: number; deltaY: number }) {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    if (!this.pcb_copper_text_id) return

    const text = db.pcb_copper_text.get(this.pcb_copper_text_id)
    if (text) {
      db.pcb_copper_text.update(this.pcb_copper_text_id, {
        anchor_position: {
          x: text.anchor_position.x + deltaX,
          y: text.anchor_position.y + deltaY,
        },
      })
    }
  }
}
