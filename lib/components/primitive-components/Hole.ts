import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { holeProps } from "@tscircuit/props"
import type { PCBHole } from "@tscircuit/soup"

export class Hole extends PrimitiveComponent<typeof holeProps> {
  pcb_hole_id: string | null = null
  isPcbPrimitive = true

  get config() {
    return {
      zodProps: holeProps,
    }
  }

  getPcbSize(): { width: number; height: number } {
    const { _parsedProps: props } = this
    return { width: props.holeDiameter, height: props.holeDiameter }
  }

  doInitialPcbPrimitiveRender(): void {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const position = this._getGlobalPcbPositionBeforeLayout()

    const pcb_hole: PCBHole = {
      type: "pcb_hole",
      hole_shape: "round",
      hole_diameter: props.holeDiameter,
      x: position.x,
      y: position.y,
    }

    const inserted_hole = db.pcb_hole.insert(pcb_hole)
    // this.pcb_hole_id = inserted_hole.pcb_hole_id!
  }
}
