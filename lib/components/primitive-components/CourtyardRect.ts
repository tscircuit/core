import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { courtyardRectProps } from "@tscircuit/props"

export class CourtyardRect extends PrimitiveComponent<
  typeof courtyardRectProps
> {
  pcb_courtyard_rect_id: string | null = null
  isPcbPrimitive = true

  get config() {
    return {
      componentName: "CourtyardRect",
      zodProps: courtyardRectProps,
    }
  }

  doInitialPcbPrimitiveRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this
    const position = this._getGlobalPcbPositionBeforeLayout()
    const { maybeFlipLayer } = this._getPcbPrimitiveFlippedHelpers()
    const layer = maybeFlipLayer(props.layer ?? "top") as "top" | "bottom"

    if (layer !== "top" && layer !== "bottom") {
      throw new Error(
        `Invalid layer "${layer}" for CourtyardRect. Must be "top" or "bottom".`,
      )
    }

    const subcircuit = this.getSubcircuit()

    const pcb_component_id =
      this.parent?.pcb_component_id ??
      this.getPrimitiveContainer()?.pcb_component_id!

    const pcb_courtyard_rect = db.pcb_courtyard_rect.insert({
      pcb_component_id,
      layer,
      center: {
        x: position.x,
        y: position.y,
      },
      width: props.width,
      height: props.height,
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
    })

    this.pcb_courtyard_rect_id = pcb_courtyard_rect.pcb_courtyard_rect_id
  }

  getPcbSize(): { width: number; height: number } {
    const { _parsedProps: props } = this
    return { width: props.width, height: props.height }
  }

  _moveCircuitJsonElements({
    deltaX,
    deltaY,
  }: { deltaX: number; deltaY: number }) {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    if (!this.pcb_courtyard_rect_id) return

    const rect = db.pcb_courtyard_rect.get(this.pcb_courtyard_rect_id)
    if (rect) {
      db.pcb_courtyard_rect.update(this.pcb_courtyard_rect_id, {
        center: {
          x: rect.center.x + deltaX,
          y: rect.center.y + deltaY,
        },
      })
    }
  }
}
