import { transformPCBElements as transformOtherPcbElements } from "@tscircuit/circuit-json-util"
import type { AnyCircuitElement } from "circuit-json"
import {
  applyToPoint,
  compose,
  rotateDEG,
  type Matrix,
} from "transformation-matrix"

/**
 * Apply a rigid PCB-frame transform to emitted geometry, in mm (+X right,
 * +Y top, right-handed with +Z above). Centers are points; local axes are
 * directions. Used for both board-to-footprint import and board-space packing.
 * The dependency transforms oval/pill centers but leaves their rotation intact,
 * so handle their entire placement here, once, with the same reference matrix.
 */
export function transformPcbElements(
  elements: AnyCircuitElement[],
  transform: Matrix,
): void {
  const otherElements: AnyCircuitElement[] = []
  for (const element of elements) {
    if (
      element.type === "pcb_silkscreen_oval" ||
      element.type === "pcb_silkscreen_pill"
    ) {
      element.center = applyToPoint(transform, element.center)
      const orientedTransform = compose(
        transform,
        rotateDEG(element.ccw_rotation ?? 0),
      )
      element.ccw_rotation =
        (Math.atan2(orientedTransform.b, orientedTransform.a) * 180) / Math.PI
    } else {
      otherElements.push(element)
    }
  }
  transformOtherPcbElements(otherElements, transform)
}
