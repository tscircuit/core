import { fabricationNotePathProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { applyToPoint } from "transformation-matrix"

export class FabricationNotePath extends PrimitiveComponent<
  typeof fabricationNotePathProps
> {
  fabrication_note_path_id: string | null = null
  isPcbPrimitive = true

  get config() {
    return {
      componentName: "FabricationNotePath",
      zodProps: fabricationNotePathProps,
    }
  }

  doInitialPcbPrimitiveRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const subcircuit = this.getSubcircuit()
    const { _parsedProps: props } = this

    const layer = props.layer ?? "top"
    if (layer !== "top" && layer !== "bottom") {
      throw new Error(
        `Invalid layer "${layer}" for SilkscreenPath. Must be "top" or "bottom".`,
      )
    }

    const transform = this._computePcbGlobalTransformBeforeLayout()

    const pcb_component_id =
      this.parent?.pcb_component_id ??
      this.getPrimitiveContainer()?.pcb_component_id!
    const fabrication_note_path = db.pcb_fabrication_note_path.insert({
      pcb_component_id,
      layer,
      color: props.color,
      route: props.route.map((p) => {
        const transformedPosition = applyToPoint(transform, {
          x: p.x,
          y: p.y,
        })
        return {
          ...p,
          x: transformedPosition.x,
          y: transformedPosition.y,
        }
      }),
      stroke_width: props.strokeWidth ?? 0.1,
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
    })

    this.fabrication_note_path_id =
      fabrication_note_path.pcb_fabrication_note_path_id
  }

  getPcbSize(): { width: number; height: number } {
    const { _parsedProps: props } = this
    if (props.route.length === 0) return { width: 0, height: 0 }

    const xs = props.route.map((point) =>
      typeof point.x === "string" ? parseFloat(point.x) : point.x,
    )
    const ys = props.route.map((point) =>
      typeof point.y === "string" ? parseFloat(point.y) : point.y,
    )

    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)

    return { width: maxX - minX, height: maxY - minY }
  }

  _moveCircuitJsonElements({
    deltaX,
    deltaY,
  }: { deltaX: number; deltaY: number }) {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    if (!this.fabrication_note_path_id) return

    const path = db.pcb_fabrication_note_path.get(this.fabrication_note_path_id)
    if (path) {
      db.pcb_fabrication_note_path.update(this.fabrication_note_path_id, {
        route: path.route.map((p) => ({
          ...p,
          x: p.x + deltaX,
          y: p.y + deltaY,
        })),
      })
    }
  }
}
