import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { holeProps } from "@tscircuit/props"
import type {
  PCBHole,
  PcbHolePill,
  PcbHoleRotatedPill,
  PcbHoleRect,
  PcbHoleCircle,
} from "circuit-json"

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
    const isRect = props.shape === "rect"

    if (isPill) {
      return {
        width: props.width,
        height: props.height,
      }
    } else if (isRect) {
      return {
        width: props.width,
        height: props.height,
      }
    } else {
      return {
        width: props.diameter,
        height: props.diameter,
      }
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
    } else if (props.shape === "rect") {
      // Rect shape
      const inserted_hole = db.pcb_hole.insert({
        type: "pcb_hole",
        hole_shape: "rect",
        hole_width: props.width,
        hole_height: props.height,
        x: position.x,
        y: position.y,
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        pcb_group_id: subcircuit?.getGroup()?.pcb_group_id ?? undefined,
      } as PcbHoleRect)
      this.pcb_hole_id = inserted_hole.pcb_hole_id!
    } else {
      // Circle shape (default)
      const inserted_hole = db.pcb_hole.insert({
        type: "pcb_hole",
        hole_shape: "circle",
        hole_diameter: props.diameter,
        x: position.x,
        y: position.y,
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        pcb_group_id: subcircuit?.getGroup()?.pcb_group_id ?? undefined,
      } as PcbHoleCircle)
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

    // Get size from props if available, otherwise from database
    let width: number
    let height: number

    if (this.pcb_hole_id && hole) {
      // Read from database based on hole shape
      if (
        hole.hole_shape === "rect" &&
        "hole_width" in hole &&
        "hole_height" in hole
      ) {
        width = hole.hole_width
        height = hole.hole_height
      } else if (
        hole.hole_shape === "pill" &&
        "hole_width" in hole &&
        "hole_height" in hole
      ) {
        width = hole.hole_width
        height = hole.hole_height
      } else if (
        hole.hole_shape === "rotated_pill" &&
        "hole_width" in hole &&
        "hole_height" in hole
      ) {
        width = hole.hole_width
        height = hole.hole_height
      } else if (
        (hole.hole_shape === "circle" || hole.hole_shape === "square") &&
        "hole_diameter" in hole
      ) {
        width = hole.hole_diameter
        height = hole.hole_diameter
      } else {
        // Fallback to props
        const size = this.getPcbSize()
        width = size.width
        height = size.height
      }
    } else {
      const size = this.getPcbSize()
      width = size.width
      height = size.height
    }

    return {
      center: { x: hole.x, y: hole.y },
      bounds: {
        left: hole.x - width / 2,
        top: hole.y - height / 2,
        right: hole.x + width / 2,
        bottom: hole.y + height / 2,
      },
      width,
      height,
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
