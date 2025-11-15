import type { PcbSmtPad, PcbPlatedHole } from "circuit-json"

export interface ObstacleDimensions {
  width: number
  height: number
}

/**
 * Calculate obstacle dimensions for an SMT pad based on its shape
 */
export function getObstacleDimensionsFromSmtPad(
  pad: PcbSmtPad,
): ObstacleDimensions | null {
  switch (pad.shape) {
    case "rect":
    case "rotated_rect":
    case "pill":
    case "rotated_pill":
      return {
        width: pad.width,
        height: pad.height,
      }

    case "circle":
      return {
        width: pad.radius * 2,
        height: pad.radius * 2,
      }

    case "polygon":
      // Calculate bounding box from all points
      if (!pad.points || pad.points.length === 0) {
        return null
      }
      const xs = pad.points.map((p) => p.x)
      const ys = pad.points.map((p) => p.y)
      const minX = Math.min(...xs)
      const maxX = Math.max(...xs)
      const minY = Math.min(...ys)
      const maxY = Math.max(...ys)
      return {
        width: maxX - minX,
        height: maxY - minY,
      }

    default:
      return null
  }
}

/**
 * Calculate obstacle dimensions for a plated hole based on its shape
 */
export function getObstacleDimensionsFromPlatedHole(
  hole: PcbPlatedHole,
): ObstacleDimensions | null {
  switch (hole.shape) {
    case "circular_hole_with_rect_pad":
    case "pill_hole_with_rect_pad":
    case "rotated_pill_hole_with_rect_pad":
      return {
        width: hole.rect_pad_width,
        height: hole.rect_pad_height,
      }

    case "circle":
      return {
        width: hole.outer_diameter,
        height: hole.outer_diameter,
      }

    case "oval":
      return {
        width: hole.outer_width,
        height: hole.outer_height,
      }

    case "pill":
      return {
        width: hole.outer_width,
        height: hole.outer_height,
      }

    case "hole_with_polygon_pad":
      // Calculate bounding box from pad outline
      if (
        !("pad_outline" in hole) ||
        !hole.pad_outline ||
        hole.pad_outline.length === 0
      ) {
        return null
      }
      const xs = hole.pad_outline.map((p) => p.x)
      const ys = hole.pad_outline.map((p) => p.y)
      const minX = Math.min(...xs)
      const maxX = Math.max(...xs)
      const minY = Math.min(...ys)
      const maxY = Math.max(...ys)
      return {
        width: maxX - minX,
        height: maxY - minY,
      }

    default:
      return null
  }
}
