import { pcbSoldermaskOpeningProps } from "@tscircuit/props"
import { getBoundsFromPoints } from "@tscircuit/math-utils"
import type { PcbSoldermaskOpening as PcbSoldermaskOpeningRecord } from "circuit-json"
import { applyToPoint, decomposeTSR } from "transformation-matrix"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

type PcbSoldermaskOpeningId =
  PcbSoldermaskOpeningRecord["pcb_soldermask_opening_id"]

/**
 * Emits mask-removal geometry in flat board/circuit world coordinates, in mm.
 * The frame is right-handed: +X right, +Y top, +Z above the board. Local points
 * receive parent placement, rotation, and footprint reflection; faces follow pads.
 */
export class PcbSoldermaskOpening extends PrimitiveComponent<
  typeof pcbSoldermaskOpeningProps
> {
  pcb_soldermask_opening_id: PcbSoldermaskOpeningId | null = null
  isPcbPrimitive = true

  get config() {
    return {
      componentName: "PcbSoldermaskOpening",
      zodProps: pcbSoldermaskOpeningProps,
    }
  }

  _getPcbLocalBoundsBeforeLayout() {
    const props = this._parsedProps
    if (props.shape === "polygon") {
      const bounds = getBoundsFromPoints(props.points)!
      return {
        left: bounds.minX,
        right: bounds.maxX,
        top: bounds.maxY,
        bottom: bounds.minY,
      }
    }
    const width = props.shape === "circle" ? props.radius * 2 : props.width
    const height = props.shape === "circle" ? props.radius * 2 : props.height
    return {
      left: -width / 2,
      right: width / 2,
      top: height / 2,
      bottom: -height / 2,
    }
  }

  getPcbSize() {
    const bounds = this._getPcbLocalBoundsBeforeLayout()
    return {
      width: bounds.right - bounds.left,
      height: bounds.top - bounds.bottom,
    }
  }

  doInitialPcbPrimitiveRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const props = this._parsedProps
    // Same paired transform and side resolution used by PCB footprint pads.
    const transform = this._computePcbGlobalTransformBeforeLayout()
    const { maybeFlipLayer, isFlipped } = this._getPcbPrimitiveFlippedHelpers()
    const container = this.getPrimitiveContainer()
    const base = {
      layer: maybeFlipLayer(props.layer) as "top" | "bottom",
      pcb_component_id:
        this.parent?.pcb_component_id ??
        container?.pcb_component_id ??
        undefined,
      pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
      subcircuit_id: this.getSubcircuit().subcircuit_id ?? undefined,
    }
    const center = applyToPoint(transform, { x: 0, y: 0 })
    // Remove the footprint's horizontal reflection for decomposition. A centered
    // rectangle is invariant under that reflection; its world rotation is not.
    const rotation =
      (decomposeTSR(transform, false, isFlipped).rotation.angle * 180) / Math.PI
    const geometry =
      props.shape === "polygon"
        ? {
            shape: "polygon" as const,
            points: props.points.map((point) => applyToPoint(transform, point)),
          }
        : props.shape === "circle"
          ? { shape: "circle" as const, ...center, radius: props.radius }
          : {
              ...(Math.abs(rotation) < 1e-8
                ? { shape: "rect" as const }
                : { shape: "rotated_rect" as const, ccw_rotation: rotation }),
              ...center,
              width: props.width,
              height: props.height,
            }
    this.pcb_soldermask_opening_id = db.pcb_soldermask_opening.insert({
      ...base,
      ...geometry,
    }).pcb_soldermask_opening_id
  }

  _moveCircuitJsonElements({
    deltaX,
    deltaY,
  }: { deltaX: number; deltaY: number }): void {
    if (!this.pcb_soldermask_opening_id) return
    const { db } = this.root!
    const opening = db.pcb_soldermask_opening.get(
      this.pcb_soldermask_opening_id,
    )!
    db.pcb_soldermask_opening.update(
      this.pcb_soldermask_opening_id,
      opening.shape === "polygon"
        ? {
            points: opening.points.map((point) => ({
              x: point.x + deltaX,
              y: point.y + deltaY,
            })),
          }
        : { x: opening.x + deltaX, y: opening.y + deltaY },
    )
  }

  doRemovePcbPrimitiveRender(): void {
    if (!this.pcb_soldermask_opening_id) return
    this.root!.db.pcb_soldermask_opening.delete(this.pcb_soldermask_opening_id)
    this.pcb_soldermask_opening_id = null
  }
}
