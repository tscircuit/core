import { pcbNoteRectProps } from "@tscircuit/props"
import { applyToPoint } from "transformation-matrix"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export class PcbNoteRect extends PrimitiveComponent<typeof pcbNoteRectProps> {
  pcb_note_rect_id: string | null = null
  isPcbPrimitive = true

  get config() {
    return {
      componentName: "PcbNoteRect",
      zodProps: pcbNoteRectProps,
    }
  }

  doInitialPcbPrimitiveRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this
    const transform = this._computePcbGlobalTransformBeforeLayout()
    const center = applyToPoint(transform, { x: 0, y: 0 })
    const subcircuit = this.getSubcircuit()
    const group = this.getGroup()

    const pcb_component_id =
      this.parent?.pcb_component_id ??
      this.getPrimitiveContainer()?.pcb_component_id ??
      undefined

    const pcb_note_rect = db.pcb_note_rect.insert({
      pcb_component_id,
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      pcb_group_id: group?.pcb_group_id ?? undefined,
      center,
      width: props.width,
      height: props.height,
      stroke_width: props.strokeWidth ?? 0.1,
      is_filled: props.isFilled ?? false,
      has_stroke: props.hasStroke ?? true,
      is_stroke_dashed: props.isStrokeDashed ?? false,
      color: props.color,
      corner_radius: props.cornerRadius ?? undefined,
    })

    this.pcb_note_rect_id = pcb_note_rect.pcb_note_rect_id
  }

  getPcbSize(): { width: number; height: number } {
    const { _parsedProps: props } = this
    const width =
      typeof props.width === "string" ? parseFloat(props.width) : props.width
    const height =
      typeof props.height === "string" ? parseFloat(props.height) : props.height

    return { width, height }
  }

  _moveCircuitJsonElements({
    deltaX,
    deltaY,
  }: { deltaX: number; deltaY: number }) {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    if (!this.pcb_note_rect_id) return

    const rect = db.pcb_note_rect.get(this.pcb_note_rect_id)
    if (rect) {
      db.pcb_note_rect.update(this.pcb_note_rect_id, {
        center: {
          x: rect.center.x + deltaX,
          y: rect.center.y + deltaY,
        },
      })
    }
  }
}
