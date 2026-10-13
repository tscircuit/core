import { solderPasteProps } from "@tscircuit/props"
import type {
  AnyCircuitElement,
  PcbSolderPaste,
  PcbSolderPasteCircle,
  PcbSolderPasteRect,
  PcbSolderPasteRotatedRect,
} from "circuit-json"
import {
  type Matrix,
  applyToPoint,
  compose,
  decomposeTSR,
  identity,
  rotate,
  translate,
} from "transformation-matrix"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

type PcbSolderPasteId = PcbSolderPaste["pcb_solder_paste_id"]
type StandalonePcbSolderPaste =
  | PcbSolderPasteCircle
  | PcbSolderPasteRect
  | PcbSolderPasteRotatedRect

export const isStandalonePcbSolderPaste = (
  element: AnyCircuitElement,
): element is StandalonePcbSolderPaste =>
  element.type === "pcb_solder_paste" &&
  !element.pcb_smtpad_id &&
  (element.shape === "circle" ||
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
  private circuitJsonRotation = 0

  /**
   * Reconstruct an aperture in its parent's local PCB frame (+X right, +Y top,
   * +Z above, right-handed, mm). sourceToParent maps source-frame points to
   * that frame; rotation is CCW degrees. The default preserves the source frame.
   * Cached records may carry rotation even though the authored props expose
   * only axis-aligned shapes. Keep that derived state separate from props.
   */
  static fromCircuitJson(
    aperture: StandalonePcbSolderPaste,
    sourceToParent: Matrix = identity(),
  ): SolderPaste {
    const transform = compose(
      sourceToParent,
      translate(aperture.x, aperture.y),
      rotate(
        ((aperture.shape === "rotated_rect" ? aperture.ccw_rotation : 0) *
          Math.PI) /
          180,
      ),
    )
    const center = applyToPoint(transform, { x: 0, y: 0 })
    const paste = new SolderPaste({
      pcbX: center.x,
      pcbY: center.y,
      layer: aperture.layer,
      ...(aperture.shape === "circle"
        ? { shape: "circle", radius: aperture.radius }
        : { shape: "rect", width: aperture.width, height: aperture.height }),
    })
    paste.circuitJsonRotation =
      (decomposeTSR(transform).rotation.angle * 180) / Math.PI
    return paste
  }

  _getPcbRotationBeforeLayout(): number {
    return this.circuitJsonRotation
  }

  get config() {
    return { componentName: "SolderPaste", zodProps: solderPasteProps }
  }

  getPcbSize() {
    const props = this._parsedProps
    return props.shape === "circle"
      ? { width: props.radius * 2, height: props.radius * 2 }
      : { width: props.width, height: props.height }
  }

  doInitialPcbPrimitiveRender(): void {
    if (this.root?.pcbDisabled) return
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
    const geometry =
      props.shape === "circle"
        ? { shape: "circle" as const, radius: props.radius }
        : {
            ...(Math.abs(rotation) < 1e-8
              ? { shape: "rect" as const }
              : { shape: "rotated_rect" as const, ccw_rotation: rotation }),
            width: props.width,
            height: props.height,
          }

    this.pcb_solder_paste_id = this.root!.db.pcb_solder_paste.insert({
      ...geometry,
      ...center,
      layer: maybeFlipLayer(authoredLayer) as "top" | "bottom",
      pcb_component_id:
        this.parent?.pcb_component_id ??
        this.getPrimitiveContainer()?.pcb_component_id ??
        undefined,
      pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
      subcircuit_id: this.getSubcircuit().subcircuit_id ?? undefined,
    }).pcb_solder_paste_id
  }

  _moveCircuitJsonElements({
    deltaX,
    deltaY,
  }: { deltaX: number; deltaY: number }): void {
    if (!this.pcb_solder_paste_id) return
    const { db } = this.root!
    // This primitive only emits centered circle/rectangle records.
    const aperture = db.pcb_solder_paste.get(
      this.pcb_solder_paste_id,
    )! as StandalonePcbSolderPaste
    db.pcb_solder_paste.update(this.pcb_solder_paste_id, {
      x: aperture.x + deltaX,
      y: aperture.y + deltaY,
    })
  }

  removePcbPrimitiveRender(): void {
    if (!this.pcb_solder_paste_id) return
    this.root!.db.pcb_solder_paste.delete(this.pcb_solder_paste_id)
    this.pcb_solder_paste_id = null
  }
}
