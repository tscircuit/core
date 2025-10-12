import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { holeProps } from "@tscircuit/props"
import type { PCBHole, PcbHolePill, PcbHoleRotatedPill } from "circuit-json"

export class Hole extends PrimitiveComponent<typeof holeProps> {
  pcb_hole_id: string | null = null
  isPcbPrimitive = true

  get config() {
    return {
      componentName: "Hole",
      zodProps: holeProps,
    }
  }

  getPcbSize(): { width: number; height: number } {
    const { _parsedProps: props } = this
    const isPill = props.shape === "pill"

    return {
      width: isPill ? props.width : props.diameter,
      height: isPill ? props.height : props.diameter,
    }
  }

  doInitialPcbPrimitiveRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this
    const subcircuit = this.getSubcircuit()
    const position = this._getGlobalPcbPositionBeforeLayout()

    if (props.shape === "pill") {
      // Check if rotation is specified to determine pill type
      if (props.pcbRotation && props.pcbRotation !== 0) {
        const inserted_hole = db.pcb_hole.insert({
          type: "pcb_hole",
          hole_shape: "rotated_pill",
          hole_width: props.width,
          hole_height: props.height,
          x: position.x,
          y: position.y,
          ccw_rotation: props.pcbRotation,
          subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
          pcb_group_id: subcircuit?.getGroup()?.pcb_group_id ?? undefined,
        } as PcbHoleRotatedPill)
        this.pcb_hole_id = inserted_hole.pcb_hole_id!
      } else {
        const inserted_hole = db.pcb_hole.insert({
          type: "pcb_hole",
          hole_shape: "pill",
          hole_width: props.width,
          hole_height: props.height,
          x: position.x,
          y: position.y,
          subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
          pcb_group_id: subcircuit?.getGroup()?.pcb_group_id ?? undefined,
        } as PcbHolePill)
        this.pcb_hole_id = inserted_hole.pcb_hole_id!
      }
    } else {
      // Circle shape (default)
      const inserted_hole = db.pcb_hole.insert({
        hole_shape: "circle",
        // @ts-ignore
        hole_diameter: props.diameter,
        x: position.x,
        y: position.y,
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        pcb_group_id: subcircuit?.getGroup()?.pcb_group_id ?? undefined,
      })
      this.pcb_hole_id = inserted_hole.pcb_hole_id!
    }
  }

  _getPcbCircuitJsonBounds(): {
    center: { x: number; y: number }
    bounds: { left: number; top: number; right: number; bottom: number }
    width: number
    height: number
  } {
    const { db } = this.root!
    const hole = db.pcb_hole.get(this.pcb_hole_id!)!
    const size = this.getPcbSize()

    return {
      center: { x: hole.x, y: hole.y },
      bounds: {
        left: hole.x - size.width / 2,
        top: hole.y - size.height / 2,
        right: hole.x + size.width / 2,
        bottom: hole.y + size.height / 2,
      },
      width: size.width,
      height: size.height,
    }
  }

  _setPositionFromLayout(newCenter: { x: number; y: number }) {
    const { db } = this.root!
    db.pcb_hole.update(this.pcb_hole_id!, {
      x: newCenter.x,
      y: newCenter.y,
    })
  }
}
