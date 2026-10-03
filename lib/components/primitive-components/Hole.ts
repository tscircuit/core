import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { holeProps } from "@tscircuit/props"
import { distance } from "circuit-json"
import { decomposeTSR } from "transformation-matrix"
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

  /**
   * Rotation (ccw degrees, normalized to [0, 360)) of the hole including its
   * own pcbRotation and the rotation of all its parents
   */
  private _getGlobalRotationDegrees(): number {
    const decomposedTransform = decomposeTSR(
      this._computePcbGlobalTransformBeforeLayout(),
    )
    const rotationDegrees = (decomposedTransform.rotation.angle * 180) / Math.PI
    const normalizedRotationDegrees = ((rotationDegrees % 360) + 360) % 360
    return Math.abs(normalizedRotationDegrees - 360) < 0.01
      ? 0
      : normalizedRotationDegrees
  }

  /**
   * rect and oval holes have no rotation field in circuit-json, so a 90/270
   * degree rotation is represented by swapping width and height
   */
  private _isRotated90Degrees(): boolean {
    const rotation = this._getGlobalRotationDegrees()
    return Math.abs(rotation - 90) < 0.01 || Math.abs(rotation - 270) < 0.01
  }

  getPcbSize(): { width: number; height: number } {
    const { _parsedProps: props } = this
    const isPill = props.shape === "pill"
    const isOval = props.shape === "oval"
    const isRect = props.shape === "rect"

    if (isPill || isOval || isRect) {
      return this._isRotated90Degrees()
        ? { width: props.height, height: props.width }
        : { width: props.width, height: props.height }
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

    const rotationDegrees = this._getGlobalRotationDegrees()
    const isRotated90Degrees = this._isRotated90Degrees()

    if (props.shape === "pill") {
      // Check if rotation is specified to determine pill type
      if (rotationDegrees !== 0) {
        const inserted_hole = db.pcb_hole.insert({
          pcb_component_id,
          type: "pcb_hole",
          hole_shape: "rotated_pill",
          hole_width: props.width,
          hole_height: props.height,
          x: position.x,
          y: position.y,
          ccw_rotation: rotationDegrees,
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
