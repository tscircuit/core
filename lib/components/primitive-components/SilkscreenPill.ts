import type { PcbSilkscreenPill } from "circuit-json"
import { applyToPoint } from "transformation-matrix"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { silkscreenPillProps } from "./silkscreen-shape-props"

/**
 * A capsule authored in footprint-local mm, emitted in right-handed board
 * space (+X right, +Y top, +Z above). Its center is a point; its axes are
 * directions. Width/height describe the unrotated shape, including its caps.
 */
export class SilkscreenPill extends PrimitiveComponent<
  typeof silkscreenPillProps
> {
  pcb_silkscreen_pill_id: PcbSilkscreenPill["pcb_silkscreen_pill_id"] | null =
    null
  isPcbPrimitive = true

  get config() {
    return { componentName: "SilkscreenPill", zodProps: silkscreenPillProps }
  }

  doInitialPcbPrimitiveRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const props = this._parsedProps
    // Paired with SilkscreenPath's placement matrix. A pill is symmetric about
    // both local axes, so the transformed X direction also handles reflection.
    const transform = this._computePcbGlobalTransformBeforeLayout()
    const { maybeFlipLayer } = this._getPcbPrimitiveFlippedHelpers()
    const layer = maybeFlipLayer(props.layer ?? "top")
    if (layer !== "top" && layer !== "bottom") {
      throw new Error(
        `Invalid layer "${layer}" for SilkscreenPill. Must be "top" or "bottom".`,
      )
    }
    const pill = db.pcb_silkscreen_pill.insert({
      center: applyToPoint(transform, { x: 0, y: 0 }),
      width: props.width,
      height: props.height,
      ccw_rotation: (Math.atan2(transform.b, transform.a) * 180) / Math.PI,
      layer,
      pcb_component_id:
        this.parent?.pcb_component_id ??
        this.getPrimitiveContainer()?.pcb_component_id!,
      pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
      subcircuit_id: this.getSubcircuit().subcircuit_id ?? undefined,
    })
    this.pcb_silkscreen_pill_id = pill.pcb_silkscreen_pill_id
  }

  /** Axis-aligned board-space extent in mm, excluding the renderer's stroke. */
  getPcbSize(): { width: number; height: number } {
    const { width, height } = this._parsedProps
    const diameter = Math.min(width, height)
    const { a, b, c, d } = this._computePcbGlobalTransformBeforeLayout()
    // A capsule is a line segment swept by a circle. Only the segment's extent
    // changes under the rigid PCB placement transform; the cap diameter stays.
    return {
      width:
        Math.abs(a) * (width - diameter) +
        Math.abs(c) * (height - diameter) +
        diameter,
      height:
        Math.abs(b) * (width - diameter) +
        Math.abs(d) * (height - diameter) +
        diameter,
    }
  }

  /** Translate the emitted board-space center by a displacement in mm. */
  _moveCircuitJsonElements({
    deltaX,
    deltaY,
  }: { deltaX: number; deltaY: number }) {
    if (this.root?.pcbDisabled || !this.pcb_silkscreen_pill_id) return
    const { db } = this.root!
    const pill = db.pcb_silkscreen_pill.get(this.pcb_silkscreen_pill_id)
    if (!pill) return
    db.pcb_silkscreen_pill.update(this.pcb_silkscreen_pill_id, {
      center: { x: pill.center.x + deltaX, y: pill.center.y + deltaY },
    })
  }
}
