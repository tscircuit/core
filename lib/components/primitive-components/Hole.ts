import { holeProps } from "@tscircuit/props"
import { distance } from "circuit-json"
import type {
  PCBHole,
  PcbHoleCircle,
  PcbHolePill,
  PcbHoleRect,
  PcbHoleRotatedPill,
} from "circuit-json"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export class Hole extends PrimitiveComponent<typeof holeProps> {
  pcb_hole_id: string | null = null
  isPcbPrimitive = true

  get config() {
    return {
      componentName: "Hole",
      zodProps: holeProps,
    }
  }

  private _getResolvedCircleDiameter(): number {
    const { _parsedProps: props } = this
    if (props.shape && props.shape !== "circle") return 0
    if (typeof props.diameter === "number" && Number.isFinite(props.diameter)) {
      return props.diameter
    }
    const rawHoleDiameter = (this.props as { holeDiameter?: string | number })
      ?.holeDiameter
    if (rawHoleDiameter !== undefined) {
      const parsed = distance.parse(rawHoleDiameter)
      if (typeof parsed === "number" && Number.isFinite(parsed)) {
        return parsed
      }
    }
    return props.diameter
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
    }
    if (isRect) {
      return {
        width: props.width,
        height: props.height,
      }
    }
    const diameter = this._getResolvedCircleDiameter()
    return {
      width: diameter,
      height: diameter,
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

    if (props.shape === "pill") {
      // Use the same footprint-to-board transform as SilkscreenPath. Its local
      // +X direction gives the slot axis in board space (+X right, +Y top),
      // including parent rotation and bottom-layer mirroring, in CCW degrees.
      const footprintLocalToBoardTransform =
        this._computePcbGlobalTransformBeforeLayout()
      const ccwRotationDegrees =
        (Math.atan2(
          footprintLocalToBoardTransform.b,
          footprintLocalToBoardTransform.a,
        ) *
          180) /
        Math.PI
      const normalizedCcwRotationDegrees =
        ((ccwRotationDegrees % 360) + 360) % 360
      if (normalizedCcwRotationDegrees !== 0) {
        const inserted_hole = db.pcb_hole.insert({
          pcb_component_id,
          type: "pcb_hole",
          hole_shape: "rotated_pill",
          hole_width: props.width,
          hole_height: props.height,
          x: position.x,
          y: position.y,
          ccw_rotation: normalizedCcwRotationDegrees,
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
        hole_width: props.width,
        hole_height: props.height,
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
        hole_width: props.width,
        hole_height: props.height,
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
      const holeDiameter = this._getResolvedCircleDiameter()
      const inserted_hole = db.pcb_hole.insert({
        pcb_component_id,
        type: "pcb_hole",
        hole_shape: "circle",
        hole_diameter: holeDiameter,
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
