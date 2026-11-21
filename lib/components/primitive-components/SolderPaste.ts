import { type SolderPasteProps, solderPasteProps } from "@tscircuit/props"
import type {
  AnyCircuitElement,
  PcbSolderPaste,
  PcbSolderPasteCircle,
  PcbSolderPasteRect,
  PcbSolderPastePill,
  PcbSolderPasteRotatedPill,
  PcbSolderPasteRotatedRect,
} from "circuit-json"
import { applyToPoint, decomposeTSR } from "transformation-matrix"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import type { SmtPad } from "./SmtPad"

type PcbSolderPasteId = PcbSolderPaste["pcb_solder_paste_id"]
type ImportedSolderPaste =
  | PcbSolderPasteCircle
  | PcbSolderPasteRect
  | PcbSolderPasteRotatedRect
  | PcbSolderPastePill
  | PcbSolderPasteRotatedPill

export const isStandalonePcbSolderPaste = (
  element: AnyCircuitElement,
): element is ImportedSolderPaste =>
  element.type === "pcb_solder_paste" &&
  !element.pcb_smtpad_id &&
  (element.shape === "circle" ||
    element.shape === "rect" ||
    element.shape === "rotated_rect" ||
    element.shape === "pill" ||
    element.shape === "rotated_pill")

/**
 * Emits independent paste apertures in the right-handed board-world PCB frame:
 * +X right, +Y top, +Z above the board, in mm. Centers are points, so parent
 * translation, rotation and footprint reflection all apply.
 */
export class SolderPaste extends PrimitiveComponent<typeof solderPasteProps> {
  pcb_solder_paste_id: PcbSolderPasteId | null = null
  isPcbPrimitive = true
  private importedSmtPad?: Pick<SmtPad, "pcb_smtpad_id">

  /**
   * Reconstruct an aperture already in its parent's local PCB frame (+X right,
   * +Y top, +Z above, right-handed, mm). Its center is a point and its rotation
   * is in CCW degrees; coordinate transforms happen before this import.
   */
  static fromCircuitJson(
    aperture: ImportedSolderPaste,
    smtPad?: Pick<SmtPad, "pcb_smtpad_id">,
  ): SolderPaste {
    const placement = {
      pcbX: aperture.x,
      pcbY: aperture.y,
      layer: aperture.layer,
    }
    let props: SolderPasteProps
    if (aperture.shape === "circle") {
      props = { ...placement, shape: "circle", radius: aperture.radius }
    } else if (aperture.shape === "pill" || aperture.shape === "rotated_pill") {
      props = {
        ...placement,
        shape: "pill",
        width: aperture.width,
        height: aperture.height,
        radius: aperture.radius,
        pcbRotation:
          aperture.shape === "rotated_pill" ? aperture.ccw_rotation : undefined,
      }
    } else {
      props = {
        ...placement,
        shape: "rect",
        width: aperture.width,
        height: aperture.height,
        pcbRotation:
          aperture.shape === "rotated_rect" ? aperture.ccw_rotation : undefined,
      }
    }
    const paste = new SolderPaste(props)
    paste.importedSmtPad = smtPad
    return paste
  }

  get config() {
    return { componentName: "SolderPaste", zodProps: solderPasteProps }
  }

  getPcbSize() {
    const props = this._parsedProps
    if (props.shape === "circle") {
      return { width: props.radius * 2, height: props.radius * 2 }
    }
    return { width: props.width, height: props.height }
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
      ...center,
      pcb_smtpad_id: this.importedSmtPad?.pcb_smtpad_id ?? undefined,
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
        shape: "circle",
        radius: props.radius,
      })
    } else if (props.shape === "pill") {
      const geometry = {
        ...base,
        width: props.width,
        height: props.height,
        radius: props.radius,
      }
      if (Math.abs(rotation) < 1e-8) {
        aperture = db.pcb_solder_paste.insert({ ...geometry, shape: "pill" })
      } else {
        aperture = db.pcb_solder_paste.insert({
          ...geometry,
          shape: "rotated_pill",
          ccw_rotation: rotation,
        })
      }
    } else if (Math.abs(rotation) < 1e-8) {
      aperture = db.pcb_solder_paste.insert({
        ...base,
        shape: "rect",
        width: props.width,
        height: props.height,
      })
    } else {
      aperture = db.pcb_solder_paste.insert({
        ...base,
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
    const aperture = db.pcb_solder_paste.get(
      this.pcb_solder_paste_id,
    )! as ImportedSolderPaste
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
