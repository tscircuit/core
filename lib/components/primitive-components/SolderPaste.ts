import { solderPasteProps } from "@tscircuit/props"
import type {
  AnyCircuitElement,
  PcbSolderPaste,
  PcbSolderPasteCircle,
  PcbSolderPasteOval,
  PcbSolderPastePolygon,
  PcbSolderPasteRect,
  PcbSolderPasteRotatedRect,
} from "circuit-json"
import { getBoundsFromPoints } from "@tscircuit/math-utils"
import { getOvalPasteContour } from "lib/utils/pcb/get-oval-paste-contour"
import { applyToPoint, decomposeTSR } from "transformation-matrix"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

type PcbSolderPasteId = PcbSolderPaste["pcb_solder_paste_id"]
type StandalonePcbSolderPaste =
  | PcbSolderPasteOval
  | PcbSolderPastePolygon
  | PcbSolderPasteCircle
  | PcbSolderPasteRect
  | PcbSolderPasteRotatedRect

export const isStandalonePcbSolderPaste = (
  element: AnyCircuitElement,
): element is StandalonePcbSolderPaste =>
  element.type === "pcb_solder_paste" &&
  !element.pcb_smtpad_id &&
  (element.shape === "oval" ||
    element.shape === "polygon" ||
    element.shape === "circle" ||
    element.shape === "rect" ||
    element.shape === "rotated_rect")

/**
 * Emits independent paste apertures in the right-handed board-world PCB frame:
 * +X right, +Y top, +Z above the board, in mm. Centers are points, so parent
 * translation, rotation and footprint reflection all apply.
 */
export class SolderPaste extends PrimitiveComponent<typeof solderPasteProps> {
  pcb_solder_paste_id: PcbSolderPasteId | null = null
  isPcbPrimitive = true

  /**
   * Reconstruct an aperture already in its parent's local PCB frame (+X right,
   * +Y top, +Z above, right-handed, mm). Its center is a point and its rotation
   * is in CCW degrees; coordinate transforms happen before this import.
   */
  static fromCircuitJson(aperture: StandalonePcbSolderPaste): SolderPaste {
    if (aperture.shape === "polygon") {
      return new SolderPaste({
        shape: "polygon",
        layer: aperture.layer,
        points: aperture.points,
        holes: aperture.holes,
      })
    }
    const placement = {
      pcbX: aperture.x,
      pcbY: aperture.y,
      layer: aperture.layer,
    }
    if (aperture.shape === "circle") {
      return new SolderPaste({
        ...placement,
        shape: "circle",
        radius: aperture.radius,
      })
    }
    return new SolderPaste({
      ...placement,
      shape: aperture.shape === "oval" ? "oval" : "rect",
      width: aperture.width,
      height: aperture.height,
      pcbRotation:
        aperture.shape === "rotated_rect" ? aperture.ccw_rotation : 0,
    })
  }

  get config() {
    return { componentName: "SolderPaste", zodProps: solderPasteProps }
  }

  _getPcbLocalBoundsBeforeLayout() {
    const props = this._parsedProps
    if (props.shape === "polygon") {
      const { minX, maxX, minY, maxY } = getBoundsFromPoints(props.points)!
      return { left: minX, right: maxX, bottom: minY, top: maxY }
    }
    const width = props.shape === "circle" ? 2 * props.radius : props.width
    const height = props.shape === "circle" ? 2 * props.radius : props.height
    return {
      left: -width / 2,
      right: width / 2,
      bottom: -height / 2,
      top: height / 2,
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
    const authoredLayer = props.layer ?? "top"
    if (authoredLayer !== "top" && authoredLayer !== "bottom") {
      throw new Error(
        `Invalid layer "${authoredLayer}" for SolderPaste. Must be "top" or "bottom".`,
      )
    }

    // Use PrimitiveComponent's paired placement/side resolution, as for
    // PcbSoldermaskOpening. Do not reconstruct the footprint's transform.
    const transform = this._computePcbGlobalTransformBeforeLayout()
    const { maybeFlipLayer, isFlipped } = this._getPcbPrimitiveFlippedHelpers()
    const center = applyToPoint(transform, { x: 0, y: 0 })
    // Remove the horizontal reflection when decomposing. A centered rectangle
    // is invariant under that reflection, while its world rotation is not.
    const rotation =
      (decomposeTSR(transform, false, isFlipped).rotation.angle * 180) / Math.PI
    const base = {
      layer: maybeFlipLayer(authoredLayer) as "top" | "bottom",
      pcb_component_id:
        this.parent?.pcb_component_id ??
        this.getPrimitiveContainer()?.pcb_component_id ??
        undefined,
      pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
      subcircuit_id: this.getSubcircuit().subcircuit_id ?? undefined,
    }
    let aperture: PcbSolderPaste
    if (props.shape === "circle") {
      aperture = db.pcb_solder_paste.insert({
        ...base,
        ...center,
        shape: "circle",
        radius: props.radius,
      })
    } else if (props.shape === "polygon") {
      aperture = db.pcb_solder_paste.insert({
        ...base,
        shape: "polygon",
        points: props.points.map((point) => applyToPoint(transform, point)),
        holes: props.holes?.map((hole) =>
          hole.map((point) => applyToPoint(transform, point)),
        ),
      })
    } else if (props.shape === "oval") {
      // Circuit JSON ovals have no rotation field. Keep axis-aligned ellipses
      // analytic; for oblique axes, use the same 64-vertex ellipse as Gerber.
      const quarterTurns = Math.round(rotation / 90)
      if (Math.abs(rotation - quarterTurns * 90) < 1e-8) {
        const swapAxes = Math.abs(quarterTurns) % 2 === 1
        aperture = db.pcb_solder_paste.insert({
          ...base,
          ...center,
          shape: "oval",
          width: swapAxes ? props.height : props.width,
          height: swapAxes ? props.width : props.height,
        })
      } else {
        const points = getOvalPasteContour(
          { x: 0, y: 0 },
          props.width,
          props.height,
        ).map((point) => applyToPoint(transform, point))
        aperture = db.pcb_solder_paste.insert({
          ...base,
          shape: "polygon",
          points,
        })
      }
    } else if (Math.abs(rotation) < 1e-8) {
      aperture = db.pcb_solder_paste.insert({
        ...base,
        ...center,
        shape: "rect",
        width: props.width,
        height: props.height,
      })
    } else {
      aperture = db.pcb_solder_paste.insert({
        ...base,
        ...center,
        shape: "rotated_rect",
        ccw_rotation: rotation,
        width: props.width,
        height: props.height,
      })
    }
    this.pcb_solder_paste_id = aperture.pcb_solder_paste_id
  }

  _moveCircuitJsonElements({
    deltaX,
    deltaY,
  }: { deltaX: number; deltaY: number }): void {
    if (!this.pcb_solder_paste_id) return
    const { db } = this.root!
    const aperture = db.pcb_solder_paste.get(this.pcb_solder_paste_id)!
    const translatePoint = (p: { x: number; y: number }) => ({
      x: p.x + deltaX,
      y: p.y + deltaY,
    })
    db.pcb_solder_paste.update(
      this.pcb_solder_paste_id,
      aperture.shape === "polygon"
        ? {
            points: aperture.points.map(translatePoint),
            holes: aperture.holes?.map((h) => h.map(translatePoint)),
          }
        : translatePoint(aperture),
    )
  }

  removePcbPrimitiveRender(): void {
    if (!this.pcb_solder_paste_id) return
    this.root!.db.pcb_solder_paste.delete(this.pcb_solder_paste_id)
    this.pcb_solder_paste_id = null
  }
}
