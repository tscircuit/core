import { courtyardOutlineProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { applyToPoint } from "transformation-matrix"

export class CourtyardOutline extends PrimitiveComponent<
  typeof courtyardOutlineProps
> {
  pcb_courtyard_outline_id: string | null = null
  isPcbPrimitive = true

  get config() {
    return {
      componentName: "CourtyardOutline",
      zodProps: courtyardOutlineProps,
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
        `Invalid layer "${layer}" for CourtyardOutline. Must be "top" or "bottom".`,
      )
    }

    const transform = this._computePcbGlobalTransformBeforeLayout()
    const subcircuit = this.getSubcircuit()
    const pcb_component_id =
      this.parent?.pcb_component_id ??
      this.getPrimitiveContainer()?.pcb_component_id!

    const pcb_courtyard_outline = db.pcb_courtyard_outline.insert({
      pcb_component_id,
      layer,
      outline: props.outline.map((p) => {
        const transformedPosition = applyToPoint(transform, {
          x: p.x,
          y: p.y,
        })
        return {
          x: transformedPosition.x,
          y: transformedPosition.y,
        }
      }),
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
    })

    this.pcb_courtyard_outline_id =
      pcb_courtyard_outline.pcb_courtyard_outline_id
  }

  _setPositionFromLayout(newCenter: { x: number; y: number }) {
    const { db } = this.root!

    const currentOutline = db.pcb_courtyard_outline.get(
      this.pcb_courtyard_outline_id!,
    )
    if (!currentOutline) return

    // Calculate the current center of the outline
    let currentCenterX = 0
    let currentCenterY = 0
    for (const point of currentOutline.outline) {
      currentCenterX += point.x
      currentCenterY += point.y
    }
    currentCenterX /= currentOutline.outline.length
    currentCenterY /= currentOutline.outline.length

    // Calculate the offset to apply to all points
    const offsetX = newCenter.x - currentCenterX
    const offsetY = newCenter.y - currentCenterY

    // Update the outline with the new translated positions
    const newOutline = currentOutline.outline.map((point) => ({
      x: point.x + offsetX,
      y: point.y + offsetY,
    }))

    db.pcb_courtyard_outline.update(this.pcb_courtyard_outline_id!, {
      outline: newOutline,
    })
  }

  _moveCircuitJsonElements({
    deltaX,
    deltaY,
  }: { deltaX: number; deltaY: number }) {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    if (!this.pcb_courtyard_outline_id) return

    const outline = db.pcb_courtyard_outline.get(this.pcb_courtyard_outline_id)
    if (outline) {
      db.pcb_courtyard_outline.update(this.pcb_courtyard_outline_id, {
        outline: outline.outline.map((p) => ({
          x: p.x + deltaX,
          y: p.y + deltaY,
        })),
      })
    }
  }

  getPcbSize(): { width: number; height: number } {
    const { _parsedProps: props } = this
    if (!props.outline || props.outline.length === 0) {
      return { width: 0, height: 0 }
    }

    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity

    for (const point of props.outline) {
      minX = Math.min(minX, point.x)
      maxX = Math.max(maxX, point.x)
      minY = Math.min(minY, point.y)
      maxY = Math.max(maxY, point.y)
    }

    return {
      width: maxX - minX,
      height: maxY - minY,
    }
  }
}
