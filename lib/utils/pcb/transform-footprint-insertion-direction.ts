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
const insertionDirectionToVector: Record<
  InsertionDirection,
  { x: number; y: number; z: number }
> = {
  from_left: { x: -1, y: 0, z: 0 },
  from_right: { x: 1, y: 0, z: 0 },
  from_top: { x: 0, y: 1, z: 0 },
  from_bottom: { x: 0, y: -1, z: 0 },
  from_above: { x: 0, y: 0, z: 1 },
  from_below: { x: 0, y: 0, z: -1 },
}

export interface BoardDirectionVector {
  x: number
  y: number
  z: number
}

export const isFootprintFlipped = (params: {
  componentLayer?: LayerRef
  originalLayer?: LayerRef
}): boolean => {
  const { componentLayer, originalLayer } = params
  return (componentLayer === "bottom") !== (originalLayer === "bottom")
}

/**
 * Converts a footprint-local direction into a unit direction vector in the
 * board's right-handed XYZ frame (+Z above the board), applying the exact same
 * rotation and layer transform as the footprint's pads. This is a direction,
 * not a point: it receives no translation. Millimetres therefore do not apply.
 *
 * Unlike `transformFootprintInsertionDirection`, this retains the continuous
 * in-plane angle. Consumers that orient physical geometry must use this vector;
 * the named direction is intentionally quantized and is only suitable for
 * choosing the nearest Cartesian side.
 */
export const transformFootprintInsertionDirectionVector = (params: {
  insertionDirection?: FootprintInsertionDirection
  rotationDegrees?: number
  isFlipped?: boolean
}): BoardDirectionVector | undefined => {
  const { insertionDirection, rotationDegrees = 0, isFlipped = false } = params
  if (!insertionDirection) return undefined

  // Circuit JSON accepts deprecated and Cartesian direction names at input,
  // but internal geometry uses the six canonical axes.
  const direction = insertionDirectionToCanonical[insertionDirection]
  const localVector = insertionDirectionToVector[direction]

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
  // frame and the component's rotation is applied after. In board 3D, flipY()
  // is the XY projection of the layer's 180-degree turn about Y: it negates X,
  // leaves Y alone, and the corresponding Z component is negated explicitly.
  const transform = compose(
    rotate((normalizeDegrees(rotationDegrees) * Math.PI) / 180),
    isFlipped ? flipY() : identity(),
  )
  const transformedXy = applyToPoint(transform, localVector)

  return {
    x: transformedXy.x,
    y: transformedXy.y,
    z: isFlipped ? -localVector.z : localVector.z,
  }
}

/**
 * Converts a footprint-frame insertion direction into the nearest canonical
 * board axis. This quantized result chooses a wall; use the paired vector
 * transform above to orient geometry within that choice.
 */
export const transformFootprintInsertionDirection = (params: {
  insertionDirection?: FootprintInsertionDirection
  rotationDegrees?: number
  isFlipped?: boolean
}): InsertionDirection | undefined => {
  const finalVector = transformFootprintInsertionDirectionVector(params)
  if (!finalVector) return undefined

  if (finalVector.z !== 0) {
    return finalVector.z > 0 ? "from_above" : "from_below"
  }

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
