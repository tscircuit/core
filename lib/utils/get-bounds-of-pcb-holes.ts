import type { PCBHole } from "circuit-json"

export interface PcbHoleBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
}

const emptyBounds: PcbHoleBounds = {
  minX: 0,
  minY: 0,
  maxX: 0,
  maxY: 0,
  width: 0,
  height: 0,
}

const toRadians = (degrees: number) => (degrees * Math.PI) / 180

export const getBoundsForPcbHole = (hole: PCBHole): PcbHoleBounds => {
  const { x, y } = hole

  if (hole.hole_shape === "circle") {
    const radius = hole.hole_diameter / 2
    return {
      minX: x - radius,
      maxX: x + radius,
      minY: y - radius,
      maxY: y + radius,
      width: radius * 2,
      height: radius * 2,
    }
  }

  if (hole.hole_shape === "rect" || hole.hole_shape === "pill") {
    const halfWidth = hole.hole_width / 2
    const halfHeight = hole.hole_height / 2
    return {
      minX: x - halfWidth,
      maxX: x + halfWidth,
      minY: y - halfHeight,
      maxY: y + halfHeight,
      width: halfWidth * 2,
      height: halfHeight * 2,
    }
  }

  if (hole.hole_shape === "rotated_pill") {
    const halfWidth = hole.hole_width / 2
    const halfHeight = hole.hole_height / 2
    const rotation = toRadians(hole.ccw_rotation ?? 0)
    const cos = Math.cos(rotation)
    const sin = Math.sin(rotation)

    const rotatedHalfWidth =
      Math.abs(halfWidth * cos) + Math.abs(halfHeight * sin)
    const rotatedHalfHeight =
      Math.abs(halfWidth * sin) + Math.abs(halfHeight * cos)

    return {
      minX: x - rotatedHalfWidth,
      maxX: x + rotatedHalfWidth,
      minY: y - rotatedHalfHeight,
      maxY: y + rotatedHalfHeight,
      width: rotatedHalfWidth * 2,
      height: rotatedHalfHeight * 2,
    }
  }

  return emptyBounds
}

export const getBoundsOfPcbHoles = (holes: PCBHole[]): PcbHoleBounds => {
  if (!holes.length) return emptyBounds

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  let hasHole = false

  for (const hole of holes) {
    const bounds = getBoundsForPcbHole(hole)
    if (bounds.width === 0 && bounds.height === 0) continue
    minX = Math.min(minX, bounds.minX)
    minY = Math.min(minY, bounds.minY)
    maxX = Math.max(maxX, bounds.maxX)
    maxY = Math.max(maxY, bounds.maxY)
    hasHole = true
  }

  if (!hasHole) return emptyBounds

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(0, maxX - minX),
    height: Math.max(0, maxY - minY),
  }
}
