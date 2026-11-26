import { courtyardPillProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export class CourtyardPill extends PrimitiveComponent<
  typeof courtyardPillProps
> {
  pcb_courtyard_pill_id: string | null = null
  isPcbPrimitive = true

  get config() {
    return {
      componentName: "CourtyardPill",
      zodProps: courtyardPillProps,
    }
  }

  doInitialPcbPrimitiveRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this
    const position = this._getGlobalPcbPositionBeforeLayout()
    const { maybeFlipLayer } = this._getPcbPrimitiveFlippedHelpers()
    const layer = maybeFlipLayer(props.layer ?? "top") as "top" | "bottom"

    if (layer !== "top" && layer !== "bottom") {
      throw new Error(
        `Invalid layer "${layer}" for CourtyardPill. Must be "top" or "bottom".`,
      )
    }

    const subcircuit = this.getSubcircuit()

    const pcb_component_id =
      this.parent?.pcb_component_id ??
      this.getPrimitiveContainer()?.pcb_component_id!

    const pcb_courtyard_pill = db.pcb_courtyard_pill.insert({
      pcb_component_id,
      layer,
      center: {
        x: position.x,
        y: position.y,
      },
      width: props.width,
      height: props.height,
      radius: props.radius,
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
    })

    this.pcb_courtyard_pill_id = pcb_courtyard_pill.pcb_courtyard_pill_id
  }

  getPcbSize(): { width: number; height: number } {
    const { _parsedProps: props } = this
    return { width: props.width, height: props.height }
  }

  _moveCircuitJsonElements({
    deltaX,
    deltaY,
  }: { deltaX: number; deltaY: number }) {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    if (!this.pcb_courtyard_pill_id) return

    const pill = db.pcb_courtyard_pill.get(this.pcb_courtyard_pill_id)
    if (pill) {
      db.pcb_courtyard_pill.update(this.pcb_courtyard_pill_id, {
        center: {
          x: pill.center.x + deltaX,
          y: pill.center.y + deltaY,
        },
      })
    }
  }
}
