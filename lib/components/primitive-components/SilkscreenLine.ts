import { silkscreenLineProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export class SilkscreenLine extends PrimitiveComponent<
  typeof silkscreenLineProps
> {
  pcb_silkscreen_line_id: string | null = null
  isPcbPrimitive = true

  get config() {
    return {
      componentName: "SilkscreenLine",
      zodProps: silkscreenLineProps,
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
        `Invalid layer "${layer}" for SilkscreenLine. Must be "top" or "bottom".`,
      )
    }
    const subcircuit = this.getSubcircuit()

    const pcb_component_id =
      this.parent?.pcb_component_id ??
      this.getPrimitiveContainer()?.pcb_component_id!
    const pcb_silkscreen_line = db.pcb_silkscreen_line.insert({
      pcb_component_id,
      layer,
      x1: props.x1,
      y1: props.y1,
      x2: props.x2,
      y2: props.y2,
      stroke_width: props.strokeWidth ?? 0.1,
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      pcb_group_id: subcircuit?.getGroup()?.pcb_group_id ?? undefined,
    })

    this.pcb_silkscreen_line_id = pcb_silkscreen_line.pcb_silkscreen_line_id
  }

  getPcbSize(): { width: number; height: number } {
    const { _parsedProps: props } = this
    const width = Math.abs(props.x2 - props.x1)
    const height = Math.abs(props.y2 - props.y1)
    return { width, height }
  }

  _repositionOnPcb({ deltaX, deltaY }: { deltaX: number; deltaY: number }) {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    if (!this.pcb_silkscreen_line_id) return

    const line = db.pcb_silkscreen_line.get(this.pcb_silkscreen_line_id)
    if (line) {
      db.pcb_silkscreen_line.update(this.pcb_silkscreen_line_id, {
        x1: line.x1 + deltaX,
        y1: line.y1 + deltaY,
        x2: line.x2 + deltaX,
        y2: line.y2 + deltaY,
      })
    }
  }
}
