import { silkscreenRectProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { applyToPoint } from "transformation-matrix"

export class SilkscreenRect extends PrimitiveComponent<
  typeof silkscreenRectProps
> {
  pcb_silkscreen_rect_id: string | null = null
  isPcbPrimitive = true

  get config() {
    return {
      componentName: "SilkscreenRect",
      zodProps: silkscreenRectProps,
    }
  }

  doInitialPcbPrimitiveRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this
    const { maybeFlipLayer } = this._getPcbPrimitiveFlippedHelpers()
    const layer = maybeFlipLayer(props.layer ?? "top") as "top" | "bottom"

    if (layer !== "top" && layer !== "bottom") {
      throw new Error(
        `Invalid layer "${layer}" for SilkscreenRect. Must be "top" or "bottom".`,
      )
    }

    const subcircuit = this.getSubcircuit()
    const position = this._getGlobalPcbPositionBeforeLayout()

    // Footprint-local dimensions (mm) plus the board-space orientation. The
    // PCB transform uses +X right, +Y up; translation affects the center only.
    const transform = this._computePcbGlobalTransformBeforeLayout()
    const direction = applyToPoint({ ...transform, e: 0, f: 0 }, { x: 1, y: 0 })
    const rotation = (Math.atan2(direction.y, direction.x) * 180) / Math.PI
    const ccwRotation = ((rotation % 360) + 360) % 360

    const pcb_component_id =
      this.parent?.pcb_component_id ??
      this.getPrimitiveContainer()?.pcb_component_id!
    const pcb_silkscreen_rect = db.pcb_silkscreen_rect.insert({
      pcb_component_id,
      layer,
      center: {
        x: position.x,
        y: position.y,
      },
      width: props.width,
      height: props.height,
      ccw_rotation: ccwRotation,
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      pcb_group_id: this?.getGroup()?.pcb_group_id ?? undefined,
      stroke_width: props.strokeWidth ?? 0.1,
      is_filled: props.filled ?? false,
      corner_radius: props.cornerRadius ?? undefined,
    })

    this.pcb_silkscreen_rect_id = pcb_silkscreen_rect.pcb_silkscreen_rect_id
  }

  getPcbSize(): { width: number; height: number } {
    const { _parsedProps: props } = this
    // Transform local corner points into board space (mm, +X right, +Y up)
    // to obtain the axis-aligned size, including arbitrary rotations/reflections.
    const transform = this._computePcbGlobalTransformBeforeLayout()
    const corners = [
      { x: -props.width / 2, y: -props.height / 2 },
      { x: props.width / 2, y: -props.height / 2 },
      { x: props.width / 2, y: props.height / 2 },
      { x: -props.width / 2, y: props.height / 2 },
    ].map((point) => applyToPoint(transform, point))
    return {
      width:
        Math.max(...corners.map((p) => p.x)) -
        Math.min(...corners.map((p) => p.x)),
      height:
        Math.max(...corners.map((p) => p.y)) -
        Math.min(...corners.map((p) => p.y)),
    }
  }

  _moveCircuitJsonElements({
    deltaX,
    deltaY,
  }: { deltaX: number; deltaY: number }) {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    if (!this.pcb_silkscreen_rect_id) return

    const rect = db.pcb_silkscreen_rect.get(this.pcb_silkscreen_rect_id)

    if (rect) {
      db.pcb_silkscreen_rect.update(this.pcb_silkscreen_rect_id, {
        center: {
          x: rect.center.x + deltaX,
          y: rect.center.y + deltaY,
        },
      })
    }
  }
}
