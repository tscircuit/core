import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { courtyardCircleProps } from "@tscircuit/props"

export class CourtyardCircle extends PrimitiveComponent<
  typeof courtyardCircleProps
> {
  pcb_courtyard_circle_id: string | null = null
  isPcbPrimitive = true

  get config() {
    return {
      componentName: "CourtyardCircle",
      zodProps: courtyardCircleProps,
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
        `Invalid layer "${layer}" for CourtyardCircle. Must be "top" or "bottom".`,
      )
    }

    const subcircuit = this.getSubcircuit()

    const pcb_component_id =
      this.parent?.pcb_component_id ??
      this.getPrimitiveContainer()?.pcb_component_id!

    const pcb_courtyard_circle = db.pcb_courtyard_circle.insert({
      pcb_component_id,
      layer,
      center: {
        x: position.x,
        y: position.y,
      },
      radius: props.radius,
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
    })

    this.pcb_courtyard_circle_id = pcb_courtyard_circle.pcb_courtyard_circle_id
  }

  getPcbSize(): { width: number; height: number } {
    const { _parsedProps: props } = this
    const diameter = props.radius * 2
    return { width: diameter, height: diameter }
  }

  _moveCircuitJsonElements({
    deltaX,
    deltaY,
  }: { deltaX: number; deltaY: number }) {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    if (!this.pcb_courtyard_circle_id) return

    const circle = db.pcb_courtyard_circle.get(this.pcb_courtyard_circle_id)
    if (circle) {
      db.pcb_courtyard_circle.update(this.pcb_courtyard_circle_id, {
        center: {
          x: circle.center.x + deltaX,
          y: circle.center.y + deltaY,
        },
      })
    }
  }
}
