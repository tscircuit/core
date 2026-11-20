import type {
  AnyCircuitElement,
  PcbSolderPastePill,
  PcbSolderPasteRotatedPill,
} from "circuit-json"
import { type Matrix, applyToPoint } from "transformation-matrix"

export const isPillSolderPaste = (
  element: AnyCircuitElement,
): element is PcbSolderPastePill | PcbSolderPasteRotatedPill =>
  element.type === "pcb_solder_paste" &&
  (element.shape === "pill" || element.shape === "rotated_pill")

/**
 * Rigid placement from aperture-local to a right-handed PCB frame (+X right,
 * +Y up, +Z above, mm). The center is a point; the mapped X axis is a direction.
 * Reflections retain the rounded rectangle because both local axes are symmetric.
 */
export function transformPcbSolderPastePill(
  {
    width,
    height,
    radius,
  }: Pick<PcbSolderPastePill, "width" | "height" | "radius">,
  transform: Matrix,
):
  | Pick<
      PcbSolderPastePill,
      "shape" | "x" | "y" | "width" | "height" | "radius"
    >
  | Pick<
      PcbSolderPasteRotatedPill,
      "shape" | "x" | "y" | "width" | "height" | "radius" | "ccw_rotation"
    > {
  const geometry = { width, height, radius }
  const center = applyToPoint(transform, { x: 0, y: 0 })
  const axis = applyToPoint(transform, { x: 1, y: 0 })
  const rotation =
    ((((Math.atan2(axis.y - center.y, axis.x - center.x) * 180) / Math.PI) %
      180) +
      180) %
    180
  if (rotation < 1e-8 || Math.abs(rotation - 180) < 1e-8) {
    return { ...geometry, ...center, shape: "pill" }
  }
  if (Math.abs(rotation - 90) < 1e-8) {
    return {
      ...geometry,
      ...center,
      shape: "pill",
      width: geometry.height,
      height: geometry.width,
    }
  }
  return {
    ...geometry,
    ...center,
    shape: "rotated_pill",
    ccw_rotation: rotation,
  }
}
