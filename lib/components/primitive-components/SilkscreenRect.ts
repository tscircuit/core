import { silkscreenRectProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { decomposeTSR } from "transformation-matrix"

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

  /**
   * Check if the component is rotated 90 or 270 degrees based on global transform.
   * For these rotations, we need to swap width/height instead of using ccw_rotation.
   */
  private _isRotated90Degrees(): boolean {
    const globalTransform = this._computePcbGlobalTransformBeforeLayout()
    const decomposedTransform = decomposeTSR(globalTransform)
    const rotationDegrees = (decomposedTransform.rotation.angle * 180) / Math.PI
    const normalizedRotationDegrees = ((rotationDegrees % 360) + 360) % 360
    const rotationTolerance = 0.01

    return (
      Math.abs(normalizedRotationDegrees - 90) < rotationTolerance ||
      Math.abs(normalizedRotationDegrees - 270) < rotationTolerance
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

    // For 0, 90, 180, 270 degree rotations, swap width/height for 90/270
    // Don't use ccw_rotation for these angles (like SilkscreenPath handles rotation)
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
    // Account for rotation by checking if width/height should be swapped
    const isRotated90Degrees = this._isRotated90Degrees()

    if (isRotated90Degrees) {
      return { width: props.height, height: props.width }
    }
    return { width: props.width, height: props.height }
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
