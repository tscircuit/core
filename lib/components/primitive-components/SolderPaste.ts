import { solderPasteProps } from "@tscircuit/props"
import { applyToPoint } from "transformation-matrix"
import { getAxisAlignedSizeFromRotatedRect } from "lib/utils/pcb/get-axis-aligned-size-from-rotated-rect"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export class SolderPaste extends PrimitiveComponent<typeof solderPasteProps> {
  pcb_solder_paste_id: string | null = null
  isPcbPrimitive = true

  get config() {
    return { componentName: "SolderPaste", zodProps: solderPasteProps }
  }

  /**
   * Emit paste-only apertures in board-world mm (+X right, +Y top, +Z above;
   * right-handed). Positions are points transformed from the footprint-local
   * frame; the rectangle's width direction is transformed without translation.
   */
  doInitialPcbPrimitiveRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this
    const transform = this._computePcbGlobalTransformBeforeLayout()
    const position = applyToPoint(transform, { x: 0, y: 0 })
    const { maybeFlipLayer } = this._getPcbPrimitiveFlippedHelpers()
    const layer = maybeFlipLayer(props.layer ?? "top")
    if (layer !== "top" && layer !== "bottom") {
      throw new Error(
        `SolderPaste requires a top or bottom layer, got "${layer}"`,
      )
    }

    const common = {
      x: position.x,
      y: position.y,
      layer,
      pcb_component_id:
        this.parent?.pcb_component_id ??
        this.getPrimitiveContainer()?.pcb_component_id ??
        undefined,
      subcircuit_id: this.getSubcircuit()?.subcircuit_id ?? undefined,
      pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
    }

    if (props.shape === "circle") {
      this.pcb_solder_paste_id = db.pcb_solder_paste.insert({
        ...common,
        shape: "circle",
        radius: props.radius,
      }).pcb_solder_paste_id
      return
    }

    // Use the same composed transform as the aperture's position, including
    // PrimitiveComponent's footprint flip. A rectangle repeats every 180°.
    const widthEndpoint = applyToPoint(transform, { x: 1, y: 0 })
    const angle =
      (Math.atan2(widthEndpoint.y - position.y, widthEndpoint.x - position.x) *
        180) /
      Math.PI
    const rotation = ((angle % 180) + 180) % 180
    const isHorizontal = rotation < 1e-8 || Math.abs(rotation - 180) < 1e-8
    const isVertical = Math.abs(rotation - 90) < 1e-8

    this.pcb_solder_paste_id = db.pcb_solder_paste.insert(
      isHorizontal || isVertical
        ? {
            ...common,
            shape: "rect",
            width: isVertical ? props.height : props.width,
            height: isVertical ? props.width : props.height,
          }
        : {
            ...common,
            shape: "rotated_rect",
            width: props.width,
            height: props.height,
            ccw_rotation: rotation,
          },
    ).pcb_solder_paste_id
  }

  getPcbSize(): { width: number; height: number } {
    const props = this._parsedProps
    return props.shape === "circle"
      ? { width: props.radius * 2, height: props.radius * 2 }
      : { width: props.width, height: props.height }
  }

  /** Axis-aligned bounds of emitted board-world geometry, in mm. */
  _getPcbCircuitJsonBounds() {
    if (!this.pcb_solder_paste_id) return super._getPcbCircuitJsonBounds()
    const paste = this.root!.db.pcb_solder_paste.get(this.pcb_solder_paste_id)!
    const { width, height } =
      paste.shape === "circle"
        ? { width: paste.radius * 2, height: paste.radius * 2 }
        : getAxisAlignedSizeFromRotatedRect({
            width: paste.width,
            height: paste.height,
            ccwRotationDegrees:
              paste.shape === "rotated_rect" ? paste.ccw_rotation : 0,
          })
    return {
      center: { x: paste.x, y: paste.y },
      width,
      height,
      bounds: {
        left: paste.x - width / 2,
        right: paste.x + width / 2,
        top: paste.y + height / 2,
        bottom: paste.y - height / 2,
      },
    }
  }

  /** Move a board-world point in mm after PCB layout. */
  _setPositionFromLayout(newCenter: { x: number; y: number }) {
    if (this.root?.pcbDisabled || !this.pcb_solder_paste_id) return
    this.root!.db.pcb_solder_paste.update(this.pcb_solder_paste_id, newCenter)
  }

  /** Translate emitted board-world geometry by a direction in mm. */
  _moveCircuitJsonElements({
    deltaX,
    deltaY,
  }: { deltaX: number; deltaY: number }) {
    if (this.root?.pcbDisabled || !this.pcb_solder_paste_id) return
    const paste = this.root!.db.pcb_solder_paste.get(this.pcb_solder_paste_id)!
    this._setPositionFromLayout({ x: paste.x + deltaX, y: paste.y + deltaY })
  }
}
