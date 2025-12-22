import { silkscreenRectProps } from "@tscircuit/props"
import { decomposeTSR } from "transformation-matrix"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

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
    const globalTransform = this._computePcbGlobalTransformBeforeLayout()
    const decomposedTransform = decomposeTSR(globalTransform)
    const rotationDegrees = (decomposedTransform.rotation.angle * 180) / Math.PI
    const normalizedRotationDegrees = ((rotationDegrees % 360) + 360) % 360
    const rotationTolerance = 0.01
    const isRotated90Degrees =
      Math.abs(normalizedRotationDegrees - 90) < rotationTolerance ||
      Math.abs(normalizedRotationDegrees - 270) < rotationTolerance

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
      width: isRotated90Degrees ? props.height : props.width,
      height: isRotated90Degrees ? props.width : props.height,
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
    return { width: props.width, height: props.height }
  }

  _repositionOnPcb({ deltaX, deltaY }: { deltaX: number; deltaY: number }) {
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
