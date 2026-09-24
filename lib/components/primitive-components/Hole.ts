import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { holeProps } from "@tscircuit/props"
import { distance } from "circuit-json"
import { applyToPoint } from "transformation-matrix"
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
    const isOval = props.shape === "oval"
    const isRect = props.shape === "rect"

    if (isPill || isOval) {
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
    const soldermaskMargin = props.solderMaskMargin
    const isCoveredWithSolderMask = props.coveredWithSolderMask ?? false
    const pcb_component_id =
      this.parent?.pcb_component_id ??
      this.getPrimitiveContainer()?.pcb_component_id

    this.emitSolderMaskMarginWarning(isCoveredWithSolderMask, soldermaskMargin)

    // Include parent footprint/group rotation, not just this hole's pcbRotation
    const globalTransform = this._computePcbGlobalTransformBeforeLayout()
    const origin = applyToPoint(globalTransform, { x: 0, y: 0 })
    const xAxis = applyToPoint(globalTransform, { x: 1, y: 0 })
    const rotationDegrees =
      (Math.atan2(xAxis.y - origin.y, xAxis.x - origin.x) * 180) / Math.PI
    const rotationTolerance = 0.01
    let normalizedRotation = ((rotationDegrees % 360) + 360) % 360
    if (Math.abs(normalizedRotation - 360) < rotationTolerance) {
      normalizedRotation = 0
    }
    const isRotated90Degrees =
      Math.abs((normalizedRotation % 180) - 90) < rotationTolerance

    if (props.shape === "pill") {
      if (normalizedRotation > rotationTolerance) {
        const inserted_hole = db.pcb_hole.insert({
          pcb_component_id,
          type: "pcb_hole",
          hole_shape: "rotated_pill",
          hole_width: props.width,
          hole_height: props.height,
          x: position.x,
          y: position.y,
          ccw_rotation: normalizedRotation,
          soldermask_margin: soldermaskMargin,
          is_covered_with_solder_mask: isCoveredWithSolderMask,
          subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
          pcb_group_id: subcircuit?.getGroup()?.pcb_group_id ?? undefined,
        } as PcbHoleRotatedPill)
        this.pcb_hole_id = inserted_hole.pcb_hole_id!
      } else {
        const inserted_hole = db.pcb_hole.insert({
          pcb_component_id,
          type: "pcb_hole",
          hole_shape: "pill",
          hole_width: props.width,
          hole_height: props.height,
          x: position.x,
          y: position.y,
          soldermask_margin: soldermaskMargin,
          is_covered_with_solder_mask: isCoveredWithSolderMask,
          subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
          pcb_group_id: subcircuit?.getGroup()?.pcb_group_id ?? undefined,
        } as PcbHolePill)
        this.pcb_hole_id = inserted_hole.pcb_hole_id!
      }
    } else if (props.shape === "oval") {
      const inserted_hole = db.pcb_hole.insert({
        pcb_component_id,
        type: "pcb_hole",
        hole_shape: "oval",
        hole_width: isRotated90Degrees ? props.height : props.width,
        hole_height: isRotated90Degrees ? props.width : props.height,
        x: position.x,
        y: position.y,
        soldermask_margin: soldermaskMargin,
        is_covered_with_solder_mask: isCoveredWithSolderMask,
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        pcb_group_id: subcircuit?.getGroup()?.pcb_group_id ?? undefined,
      } as PCBHole)
      this.pcb_hole_id = inserted_hole.pcb_hole_id!
    } else if (props.shape === "rect") {
      // Rect shape
      const inserted_hole = db.pcb_hole.insert({
        pcb_component_id,
        type: "pcb_hole",
        hole_shape: "rect",
        hole_width: isRotated90Degrees ? props.height : props.width,
        hole_height: isRotated90Degrees ? props.width : props.height,
        x: position.x,
        y: position.y,
        soldermask_margin: soldermaskMargin,
        is_covered_with_solder_mask: isCoveredWithSolderMask,
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        pcb_group_id: subcircuit?.getGroup()?.pcb_group_id ?? undefined,
      } as PcbHoleRect)
      this.pcb_hole_id = inserted_hole.pcb_hole_id!
    } else {
      // Circle shape (default)
      const inserted_hole = db.pcb_hole.insert({
        pcb_component_id,
        type: "pcb_hole",
        hole_shape: "circle",
        hole_diameter: props.diameter,
        x: position.x,
        y: position.y,
        soldermask_margin: soldermaskMargin,
        is_covered_with_solder_mask: isCoveredWithSolderMask,
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

  _moveCircuitJsonElements({
    deltaX,
    deltaY,
  }: { deltaX: number; deltaY: number }) {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    if (!this.pcb_hole_id) return
    const hole = db.pcb_hole.get(this.pcb_hole_id)!
    if (hole) {
      db.pcb_hole.update(this.pcb_hole_id, {
        x: hole.x + deltaX,
        y: hole.y + deltaY,
      })
    }
  }
}
