import { normalizeDegrees } from "@tscircuit/math-utils"
import type { FootprintInsertionDirection } from "@tscircuit/props"
import type { LayerRef, PcbComponent } from "circuit-json"

const directionToVector: Record<
  Exclude<FootprintInsertionDirection, "from_above">,
  { x: number; y: number }
> = {
  from_left: { x: -1, y: 0 },
  from_right: { x: 1, y: 0 },
  from_front: { x: 0, y: 1 },
  from_back: { x: 0, y: -1 },
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
  if (insertionDirection === "from_above") return insertionDirection

  const baseVector = directionToVector[insertionDirection]
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

  return finalVector.y >= 0 ? "from_front" : "from_back"
}
