import { silkscreenRectProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { decomposeTSR } from "transformation-matrix"
import { getAxisAlignedSizeFromRotatedRect } from "lib/utils/pcb/get-axis-aligned-size-from-rotated-rect"

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
   * Resolve rotation from global transform. For 0/90/180/270 degree rotations,
   * swap width/height for 90/270 instead of emitting ccw_rotation; for other
   * angles, preserve width/height and emit ccw_rotation.
   */
  private _getRotationInfo(): {
    isRotated90Degrees: boolean
    ccwRotation: number | undefined
  } {
    const globalTransform = this._computePcbGlobalTransformBeforeLayout()
    const decomposedTransform = decomposeTSR(globalTransform)
    const rotationDegrees = (decomposedTransform.rotation.angle * 180) / Math.PI
    const normalizedRotationDegrees = ((rotationDegrees % 360) + 360) % 360
    const rotationTolerance = 0.01

    const isAxisAligned =
      Math.abs(normalizedRotationDegrees) < rotationTolerance ||
      Math.abs(normalizedRotationDegrees - 180) < rotationTolerance ||
      Math.abs(normalizedRotationDegrees - 360) < rotationTolerance
    const isRotated90Degrees =
      Math.abs(normalizedRotationDegrees - 90) < rotationTolerance ||
      Math.abs(normalizedRotationDegrees - 270) < rotationTolerance

    if (isAxisAligned || isRotated90Degrees) {
      return {
        isRotated90Degrees,
        ccwRotation: undefined,
      }
    }

    const { isFlipped } = this._getPcbPrimitiveFlippedHelpers()
    const finalRotationDegrees = isFlipped
      ? (360 - normalizedRotationDegrees + 360) % 360
      : normalizedRotationDegrees

    return {
      isRotated90Degrees: false,
      ccwRotation: finalRotationDegrees,
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

    const { isRotated90Degrees, ccwRotation } = this._getRotationInfo()
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
    const { isRotated90Degrees, ccwRotation } = this._getRotationInfo()

    if (isRotated90Degrees) {
      return { width: props.height, height: props.width }
    }
    if (ccwRotation !== undefined) {
      const { width, height } = getAxisAlignedSizeFromRotatedRect({
        width: props.width,
        height: props.height,
        ccwRotationDegrees: ccwRotation,
      })
      return { width, height }
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
