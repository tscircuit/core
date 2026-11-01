import { silkscreenRectProps } from "@tscircuit/props"
import type { PcbSilkscreenRect } from "circuit-json"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { getAxisAlignedSizeFromRotatedRect } from "lib/utils/pcb/get-axis-aligned-size-from-rotated-rect"

export class SilkscreenRect extends PrimitiveComponent<
  typeof silkscreenRectProps
> {
  pcb_silkscreen_rect_id: string | null = null
  isPcbPrimitive = true
  private circuitJsonRotation: number | null = null

  /**
   * Restore a rectangle in its parent's local PCB frame: mm, +X right, +Y
   * top, +Z above, right-handed. The center is a point; rotation is CCW in
   * degrees. Like SolderPaste.fromCircuitJson, keep imported orientation
   * separate from authored props, which only expose axis-aligned rectangles.
   */
  static fromCircuitJson(rect: PcbSilkscreenRect): SilkscreenRect {
    const silkscreenRect = new SilkscreenRect({
      pcbX: rect.center.x,
      pcbY: rect.center.y,
      width: rect.width,
      height: rect.height,
      layer: rect.layer,
      strokeWidth: rect.stroke_width,
      filled: rect.is_filled,
      cornerRadius: rect.corner_radius,
    })
    silkscreenRect.circuitJsonRotation = rect.ccw_rotation ?? 0
    return silkscreenRect
  }

  _getPcbRotationBeforeLayout(): number | null {
    return this.circuitJsonRotation ?? super._getPcbRotationBeforeLayout()
  }

  get config() {
    return {
      componentName: "SilkscreenRect",
      zodProps: silkscreenRectProps,
    }
  }

  private _getPcbCcwRotationDegrees(): number {
    // Same placement matrix as SilkscreenPath's corners: footprint-local to
    // board space (+X right, +Y top), including bottom-layer mirroring.
    const footprintLocalToBoardTransform =
      this._computePcbGlobalTransformBeforeLayout()
    return (
      (Math.atan2(
        footprintLocalToBoardTransform.b,
        footprintLocalToBoardTransform.a,
      ) *
        180) /
      Math.PI
    )
  }

  /** Quarter turns use swapped dimensions instead of ccw_rotation. */
  private _isRotated90Degrees(): boolean {
    const ccwRotationDegrees = this._getPcbCcwRotationDegrees()
    const normalizedCcwRotationDegrees =
      ((ccwRotationDegrees % 360) + 360) % 360
    const rotationToleranceDegrees = 0.01

    return (
      Math.abs(normalizedCcwRotationDegrees - 90) < rotationToleranceDegrees ||
      Math.abs(normalizedCcwRotationDegrees - 270) < rotationToleranceDegrees
    )
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

    // Preserve the existing axis-aligned representation for quarter turns.
    const isRotated90Degrees = this._isRotated90Degrees()
    const finalWidth = isRotated90Degrees ? props.height : props.width
    const finalHeight = isRotated90Degrees ? props.width : props.height

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
      width: finalWidth,
      height: finalHeight,
      ccw_rotation: isRotated90Degrees ? 0 : this._getPcbCcwRotationDegrees(),
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      pcb_group_id: this?.getGroup()?.pcb_group_id ?? undefined,
      stroke_width: props.strokeWidth ?? 0.1,
      is_filled: props.filled ?? false,
      corner_radius: props.cornerRadius ?? undefined,
    })

    this.pcb_silkscreen_rect_id = pcb_silkscreen_rect.pcb_silkscreen_rect_id
  }

  /** Axis-aligned board-space size in mm (+X right, +Y top). */
  getPcbSize(): { width: number; height: number } {
    const { _parsedProps: props } = this
    const { width, height } = getAxisAlignedSizeFromRotatedRect({
      width: props.width,
      height: props.height,
      ccwRotationDegrees: this._getPcbCcwRotationDegrees(),
    })
    return { width, height }
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
