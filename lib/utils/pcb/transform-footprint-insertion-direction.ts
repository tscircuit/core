import { normalizeDegrees } from "@tscircuit/math-utils"
import type { FootprintInsertionDirection } from "@tscircuit/props"
import {
  type InsertionDirection,
  type LayerRef,
  insertionDirectionToCanonical,
} from "circuit-json"

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

  const direction = insertionDirectionToCanonical[insertionDirection]

  // Rotating a footprint within the board plane leaves a Z-axis insertion
  // pointing along Z, but moving the part to the other layer means the mating
  // part now approaches the board from the opposite side.
  if (direction === "from_above" || direction === "from_below") {
    if (!isFlipped) return direction
    return direction === "from_above" ? "from_below" : "from_above"
  }

  const baseVector = inPlaneDirectionToVector[direction]
  const angleRadians = (normalizeDegrees(rotationDegrees) * Math.PI) / 180
  const rotatedVector = {
    x:
      baseVector.x * Math.cos(angleRadians) -
      baseVector.y * Math.sin(angleRadians),
    y:
      baseVector.x * Math.sin(angleRadians) +
      baseVector.y * Math.cos(angleRadians),
  }
  const finalVector = isFlipped
    ? { x: rotatedVector.x, y: -rotatedVector.y }
    : rotatedVector

  if (Math.abs(finalVector.x) >= Math.abs(finalVector.y)) {
    return finalVector.x >= 0 ? "from_right" : "from_left"
  }

  return finalVector.y >= 0 ? "from_top" : "from_bottom"
}
