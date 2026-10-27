import type { PcbSilkscreenOval } from "circuit-json"
import { applyToPoint } from "transformation-matrix"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { silkscreenOvalProps } from "./silkscreen-shape-props"

/**
 * An ellipse authored in footprint-local mm, emitted in right-handed board
 * space (+X right, +Y top, +Z above). Its center is a point; its axes are
 * directions. Placement includes parent rotation and footprint reflection.
 */
export class SilkscreenOval extends PrimitiveComponent<
  typeof silkscreenOvalProps
> {
  pcb_silkscreen_oval_id: PcbSilkscreenOval["pcb_silkscreen_oval_id"] | null =
    null
  isPcbPrimitive = true

  get config() {
    return { componentName: "SilkscreenOval", zodProps: silkscreenOvalProps }
  }

  doInitialPcbPrimitiveRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const props = this._parsedProps
    // Use the same placement matrix as SilkscreenPath's points. An ellipse
    // is symmetric about each local axis, so its transformed X axis suffices
    // to orient it even when the footprint is mirrored onto the other layer.
    const transform = this._computePcbGlobalTransformBeforeLayout()
    const { maybeFlipLayer } = this._getPcbPrimitiveFlippedHelpers()
    const layer = maybeFlipLayer(props.layer ?? "top")
    if (layer !== "top" && layer !== "bottom") {
      throw new Error(
        `Invalid layer "${layer}" for SilkscreenOval. Must be "top" or "bottom".`,
      )
    }
    const oval = db.pcb_silkscreen_oval.insert({
      center: applyToPoint(transform, { x: 0, y: 0 }),
      radius_x: props.radiusX,
      radius_y: props.radiusY,
      ccw_rotation: (Math.atan2(transform.b, transform.a) * 180) / Math.PI,
      layer,
      pcb_component_id:
        this.parent?.pcb_component_id ??
        this.getPrimitiveContainer()?.pcb_component_id!,
      pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
      subcircuit_id: this.getSubcircuit().subcircuit_id ?? undefined,
    })
    this.pcb_silkscreen_oval_id = oval.pcb_silkscreen_oval_id
  }

  /** Axis-aligned board-space extent in mm, excluding the renderer's stroke. */
  getPcbSize(): { width: number; height: number } {
    const { radiusX, radiusY } = this._parsedProps
    const { a, b, c, d } = this._computePcbGlobalTransformBeforeLayout()
    return {
      width: 2 * Math.hypot(radiusX * a, radiusY * c),
      height: 2 * Math.hypot(radiusX * b, radiusY * d),
    }
  }

  /** Translate the emitted board-space center by a displacement in mm. */
  _moveCircuitJsonElements({
    deltaX,
    deltaY,
  }: { deltaX: number; deltaY: number }) {
    if (this.root?.pcbDisabled || !this.pcb_silkscreen_oval_id) return
    const { db } = this.root!
    const oval = db.pcb_silkscreen_oval.get(this.pcb_silkscreen_oval_id)
    if (!oval) return
    db.pcb_silkscreen_oval.update(this.pcb_silkscreen_oval_id, {
      center: { x: oval.center.x + deltaX, y: oval.center.y + deltaY },
    })
  }
}
