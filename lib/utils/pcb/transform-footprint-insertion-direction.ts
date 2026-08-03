import { normalizeDegrees } from "@tscircuit/math-utils"
import type { FootprintInsertionDirection } from "@tscircuit/props"
import type { LayerRef } from "circuit-json"

type CanonicalInsertionDirection =
  | "from_left"
  | "from_right"
  | "from_top"
  | "from_bottom"
  | "from_above"
  | "from_below"

const insertionDirectionToCanonical: Record<
  FootprintInsertionDirection,
  CanonicalInsertionDirection
> = {
  from_left: "from_left",
  from_right: "from_right",
  from_front: "from_top",
  from_back: "from_bottom",
  from_above: "from_above",
}

const insertionDirectionToVector: Record<
  CanonicalInsertionDirection,
  { x: number; y: number; z: number }
> = {
  from_left: { x: -1, y: 0, z: 0 },
  from_right: { x: 1, y: 0, z: 0 },
  from_top: { x: 0, y: 1, z: 0 },
  from_bottom: { x: 0, y: -1, z: 0 },
  from_above: { x: 0, y: 0, z: 1 },
  from_below: { x: 0, y: 0, z: -1 },
}

export const isFootprintFlipped = (params: {
  componentLayer?: LayerRef
  originalLayer?: LayerRef
}): boolean => {
  const { componentLayer, originalLayer } = params
  return (componentLayer === "bottom") !== (originalLayer === "bottom")
}

export const transformFootprintInsertionDirection = (params: {
  insertionDirection?: FootprintInsertionDirection
  rotationDegrees?: number
  isFlipped?: boolean
}): FootprintInsertionDirection | undefined => {
  const { insertionDirection, rotationDegrees = 0, isFlipped = false } = params

  if (!insertionDirection) return undefined

  // Circuit JSON accepts deprecated direction names at input, but
  // pcb_component.insertion_direction is written with the canonical names.
  const canonicalDirection = insertionDirectionToCanonical[insertionDirection]
  const baseVector = insertionDirectionToVector[canonicalDirection]

  // Z-axis insertion directions do not change when a footprint is rotated or
  // mirrored in the PCB plane.
  if (baseVector.z !== 0) {
    return canonicalDirection as FootprintInsertionDirection
  }

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

  // `from_top` and `from_bottom` are canonical Circuit JSON values. The
  // props package still types this field with the deprecated union, so the
  // boundary cast keeps source compatibility while emitting the new values.
  return (
    finalVector.y >= 0 ? "from_top" : "from_bottom"
  ) as FootprintInsertionDirection
}
