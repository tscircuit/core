import { pcbNoteLineProps } from "@tscircuit/props"
import { convertColorName } from "lib/utils/colors"
import { applyToPoint } from "transformation-matrix"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export class PcbNoteLine extends PrimitiveComponent<typeof pcbNoteLineProps> {
  pcb_note_line_id: string | null = null
  isPcbPrimitive = true

  get config() {
    return {
      componentName: "PcbNoteLine",
      zodProps: pcbNoteLineProps,
    }
  }

  doInitialPcbPrimitiveRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this
    const subcircuit = this.getSubcircuit()
    const group = this.getGroup()
    const transform = this._computePcbGlobalTransformBeforeLayout()

    const start = applyToPoint(transform, { x: props.x1, y: props.y1 })
    const end = applyToPoint(transform, { x: props.x2, y: props.y2 })

    const pcb_component_id =
      this.parent?.pcb_component_id ??
      this.getPrimitiveContainer()?.pcb_component_id ??
      undefined

    const pcb_note_line = db.pcb_note_line.insert({
      pcb_component_id,
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      pcb_group_id: group?.pcb_group_id ?? undefined,
      x1: start.x,
      y1: start.y,
      x2: end.x,
      y2: end.y,
      stroke_width: props.strokeWidth ?? 0.1,
      color: props.color ? convertColorName(props.color) : undefined,
      is_dashed: props.isDashed,
    })

    this.pcb_note_line_id = pcb_note_line.pcb_note_line_id
  }

  getPcbSize(): { width: number; height: number } {
    const { _parsedProps: props } = this
    return {
      width: Math.abs(props.x2 - props.x1),
      height: Math.abs(props.y2 - props.y1),
    }
  }
}
