import { normalizeDegrees } from "@tscircuit/math-utils"
import type { FootprintInsertionDirection } from "@tscircuit/props"
import {
  type InsertionDirection,
  type LayerRef,
  insertionDirectionToCanonical,
} from "circuit-json"
import {
  applyToPoint,
  compose,
  flipY,
  identity,
  rotate,
} from "transformation-matrix"

/**
 * Unit vectors for the directions that lie in the board plane. The Z-axis
 * directions are handled separately because rotating a footprint within the
 * board plane cannot change them.
 */
const inPlaneDirectionToVector: Record<
  Exclude<InsertionDirection, "from_above" | "from_below">,
  { x: number; y: number }
> = {
  from_left: { x: -1, y: 0 },
  from_right: { x: 1, y: 0 },
  from_top: { x: 0, y: 1 },
  from_bottom: { x: 0, y: -1 },
}

export const isFootprintFlipped = (params: {
  componentLayer?: LayerRef
  originalLayer?: LayerRef
}): boolean => {
  const { componentLayer, originalLayer } = params
  return (componentLayer === "bottom") !== (originalLayer === "bottom")
}

/**
 * Converts a footprint-frame insertion direction into board coordinates by
 * applying the component's rotation and layer.
 *
 * Accepts either spelling the props enum allows and always returns one of the
 * six canonical named directions.
 */
export const transformFootprintInsertionDirection = (params: {
  insertionDirection?: FootprintInsertionDirection
  rotationDegrees?: number
  isFlipped?: boolean
}): InsertionDirection | undefined => {
  const { insertionDirection, rotationDegrees = 0, isFlipped = false } = params

  if (!insertionDirection) return undefined

  // Circuit JSON accepts deprecated and Cartesian direction names at input,
  // but pcb_component.insertion_direction is written with the canonical names.
  const direction = insertionDirectionToCanonical[insertionDirection]

  // A footprint moved to the other layer is rotated 180 degrees about the
  // board's Y axis, so an insertion along Z now points the opposite way.
  if (direction === "from_above" || direction === "from_below") {
    if (!isFlipped) return direction
    return direction === "from_above" ? "from_below" : "from_above"
  }

  // Reuse the transform PrimitiveComponent applies to the footprint's own
  // geometry, so this direction cannot drift from where the pads land. From
  // PrimitiveComponent._computePcbGlobalTransformBeforeLayout, the
  // `isPcbPrimitive && isFlipped` branch:
  //
  //   compose(
  //     this.parent?._computePcbGlobalTransformBeforeLayout() ?? identity(),
  //     flipY(),
  //     this.computePcbPropsTransform(),
  //   )
  //
  // compose() applies right to left, so the footprint is flipped in its own
  // frame and the component's rotation is applied after. flipY() mirrors on
  // the y-axis, which negates X and leaves Y alone.
  const transform = compose(
    rotate((normalizeDegrees(rotationDegrees) * Math.PI) / 180),
    isFlipped ? flipY() : identity(),
  )
  const finalVector = applyToPoint(
    transform,
    inPlaneDirectionToVector[direction],
  )

  if (Math.abs(finalVector.x) >= Math.abs(finalVector.y)) {
    return finalVector.x >= 0 ? "from_right" : "from_left"
  }

  // `from_top` and `from_bottom` are canonical Circuit JSON values. props types
  // the prop with the wide input union (InsertionDirectionInput, which also
  // admits the Cartesian and deprecated spellings), while
  // pcb_component.insertion_direction is the narrow six-name InsertionDirection
  // union returned here.
  return finalVector.y >= 0 ? "from_top" : "from_bottom"
}
