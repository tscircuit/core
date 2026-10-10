import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { courtyardCircleProps } from "@tscircuit/props"
import { applyToPoint, identity, type Matrix } from "transformation-matrix"

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

  /** Emit board-space points (+X right, +Y up, mm), applying resolved placement
   * after the footprint-pad transform, including its layer reflection.
   */
  renderPcbCourtyard(pcbLayoutTransform: Matrix = identity()): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this
    const position = applyToPoint(
      pcbLayoutTransform,
      this._getGlobalPcbPositionBeforeLayout(),
    )
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

    const courtyard = {
      pcb_component_id,
      layer,
      center: {
        x: position.x,
        y: position.y,
      },
      radius: props.radius,
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
    }

    if (this.pcb_courtyard_circle_id) {
      db.pcb_courtyard_circle.update(this.pcb_courtyard_circle_id, courtyard)
    } else {
      this.pcb_courtyard_circle_id =
        db.pcb_courtyard_circle.insert(courtyard).pcb_courtyard_circle_id
    }
  }

  removePcbCourtyard(): void {
    if (!this.pcb_courtyard_circle_id) return
    this.root!.db.pcb_courtyard_circle.delete(this.pcb_courtyard_circle_id)
    this.pcb_courtyard_circle_id = null
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
