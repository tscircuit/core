import {
  applyToPoint,
  decomposeTSR,
  identity,
  type Matrix,
} from "transformation-matrix"
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
    const { maybeFlipLayer, isFlipped } = this._getPcbPrimitiveFlippedHelpers()
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

    const decomposedTransform = decomposeTSR(
      this._computePcbGlobalTransformBeforeLayout(),
    )
    const ccwRotationDegrees =
      (decomposedTransform.rotation.angle * 180) / Math.PI
    let ccw_rotation = ((ccwRotationDegrees % 360) + 360) % 360

    if (isFlipped) {
      ccw_rotation = (180 - ccw_rotation + 360) % 360
    }
    ccw_rotation =
      (ccw_rotation +
        (decomposeTSR(pcbLayoutTransform).rotation.angle * 180) / Math.PI +
        360) %
      360

    const courtyard = {
      pcb_component_id,
      layer,
      center: {
        x: position.x,
        y: position.y,
      },
      width: props.width,
      height: props.height,
      ccw_rotation: ccw_rotation || undefined,
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
    }

    if (this.pcb_courtyard_rect_id) {
      db.pcb_courtyard_rect.update(this.pcb_courtyard_rect_id, courtyard)
    } else {
      this.pcb_courtyard_rect_id =
        db.pcb_courtyard_rect.insert(courtyard).pcb_courtyard_rect_id
    }
  }

  removePcbCourtyard(): void {
    if (!this.pcb_courtyard_rect_id) return
    this.root!.db.pcb_courtyard_rect.delete(this.pcb_courtyard_rect_id)
    this.pcb_courtyard_rect_id = null
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
