import { pcbNotePathProps } from "@tscircuit/props"
import { convertColorName } from "lib/utils/colors/convert-color-name"
import { applyToPoint } from "transformation-matrix"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export class PcbNotePath extends PrimitiveComponent<typeof pcbNotePathProps> {
  pcb_note_path_id: string | null = null
  isPcbPrimitive = true

  get config() {
    return {
      componentName: "PcbNotePath",
      zodProps: pcbNotePathProps,
    }
  }

  doInitialPcbPrimitiveRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this
    const transform = this._computePcbGlobalTransformBeforeLayout()
    const subcircuit = this.getSubcircuit()
    const group = this.getGroup()

    const pcb_component_id =
      this.parent?.pcb_component_id ??
      this.getPrimitiveContainer()?.pcb_component_id ??
      undefined

    const transformedRoute = props.route.map((point) => {
      const { x, y, ...rest } = point
      const numericX = typeof x === "string" ? parseFloat(x) : x
      const numericY = typeof y === "string" ? parseFloat(y) : y
      const transformed = applyToPoint(transform, { x: numericX, y: numericY })
      return { ...rest, x: transformed.x, y: transformed.y }
    })

    const pcb_note_path = db.pcb_note_path.insert({
      pcb_component_id,
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      pcb_group_id: group?.pcb_group_id ?? undefined,
      route: transformedRoute,
      stroke_width: props.strokeWidth ?? 0.1,
      color: props.color ? convertColorName(props.color) : undefined,
    })

    this.pcb_note_path_id = pcb_note_path.pcb_note_path_id
  }

  getPcbSize(): { width: number; height: number } {
    const { _parsedProps: props } = this
    if (props.route.length === 0) return { width: 0, height: 0 }

    const xs = props.route.map((point) =>
      typeof point.x === "string" ? parseFloat(point.x) : point.x,
    )
    const ys = props.route.map((point) =>
      typeof point.y === "string" ? parseFloat(point.y) : point.y,
    )

    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)

    return { width: maxX - minX, height: maxY - minY }
  }
}
