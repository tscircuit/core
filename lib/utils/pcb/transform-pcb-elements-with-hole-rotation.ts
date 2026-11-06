import { transformPCBElements } from "@tscircuit/circuit-json-util"
import type { AnyCircuitElement } from "circuit-json"
import type { Matrix } from "transformation-matrix"

const normalizeDegrees = (degrees: number) => {
  const normalized = ((degrees % 360) + 360) % 360
  const rounded = Math.round(normalized)
  // Packing produces values like -90.00000000000001; snap float noise so the
  // result matches what an explicit pcbRotation would produce.
  const snapped = Math.abs(normalized - rounded) < 1e-6 ? rounded : normalized
  return snapped === 360 ? 0 : snapped
}

const rotateHoleElement = (elm: any, rotationDegrees: number) => {
  const addRotation = (current: number | undefined) =>
    normalizeDegrees((current ?? 0) + rotationDegrees)

  if (elm.type === "pcb_plated_hole") {
    switch (elm.shape) {
      case "pill":
      case "oval":
      case "hole_with_polygon_pad":
        elm.ccw_rotation = addRotation(elm.ccw_rotation)
        return
      case "circular_hole_with_rect_pad":
        elm.rect_ccw_rotation = addRotation(elm.rect_ccw_rotation)
        return
      case "rotated_pill_hole_with_rect_pad":
        elm.hole_ccw_rotation = addRotation(elm.hole_ccw_rotation)
        elm.rect_ccw_rotation = addRotation(elm.rect_ccw_rotation)
        return
      case "pill_hole_with_rect_pad": {
        // This shape has no rotation field; use the rotated variant, the same
        // way PlatedHole does for a non-zero pcbRotation.
        const rotation = addRotation(0)
        Object.assign(elm, {
          shape: "rotated_pill_hole_with_rect_pad",
          hole_shape: "rotated_pill",
          hole_ccw_rotation: rotation,
          rect_ccw_rotation: rotation,
        })
        return
      }
    }
    return
  }

  if (elm.type === "pcb_hole") {
    if (elm.hole_shape === "rotated_pill") {
      elm.ccw_rotation = addRotation(elm.ccw_rotation)
    } else if (elm.hole_shape === "pill") {
      Object.assign(elm, {
        hole_shape: "rotated_pill",
        ccw_rotation: addRotation(0),
      })
    }
    return
  }

  if (elm.type === "pcb_solder_paste" && elm.shape === "rotated_pill") {
    elm.ccw_rotation = addRotation(elm.ccw_rotation)
  }
}

/**
 * transformPCBElements moves holes but leaves their rotation untouched, so a
 * rotated component keeps its slotted holes and rect hole pads in their
 * original orientation. Apply the matrix rotation to those fields as well.
 */
export const transformPcbElementsWithHoleRotation = <
  T extends AnyCircuitElement,
>(
  elements: T[],
  matrix: Matrix,
): T[] => {
  transformPCBElements(elements as any, matrix)

  // Mirrored transforms (e.g. bottom-layer flips) are not produced by the
  // callers of this helper; leave their hole rotation as-is.
  const isReflected = matrix.a * matrix.d - matrix.b * matrix.c < 0
  if (isReflected) return elements

  const rotationDegrees = (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI
  if (normalizeDegrees(rotationDegrees) === 0) return elements

  for (const elm of elements) {
    rotateHoleElement(elm, rotationDegrees)
  }
  return elements
}
