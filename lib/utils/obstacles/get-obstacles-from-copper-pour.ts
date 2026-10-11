import { getPourPolygon } from "@tscircuit/circuit-json-util"
import type { PcbCopperPour } from "circuit-json"
import { fillCopperPolygonWithRects } from "./fillCopperPolygonWithRects"
import type { Obstacle } from "./types"

/**
 * Covers materialized copper with fixed SRJ rectangles, retaining hole interiors.
 * Points are circuit-world mm in a right-handed frame (+X right, +Y up, +Z above).
 * Rectangles and polygons use the canonical pour transform; BREP bulges stay arcs.
 * For valid simple BREP rings, boundary overfill is bounded by maxBoundaryError
 * plus floating-point rounding. Axis-aligned copper is exact up to rounding.
 */
export const getObstaclesFromCopperPour = (
  pour: PcbCopperPour,
  connectedTo: Obstacle["connectedTo"],
  maxBoundaryError = 0.025,
): Obstacle[] => {
  let tinyPolygonRect:
    | { center: { x: number; y: number }; width: number; height: number }
    | undefined
  if (pour.shape === "polygon") {
    const minX = Math.min(...pour.points.map((point) => point.x))
    const maxX = Math.max(...pour.points.map((point) => point.x))
    const minY = Math.min(...pour.points.map((point) => point.y))
    const maxY = Math.max(...pour.points.map((point) => point.y))
    // Flatten can collapse sub-micron vertices. When this whole polygon fits
    // inside the error allowance, its box is a conservative bounded cover.
    if (Math.hypot(maxX - minX, maxY - minY) <= maxBoundaryError) {
      tinyPolygonRect = {
        center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
        width: maxX - minX,
        height: maxY - minY,
      }
    }
  }
  const copperRects = tinyPolygonRect
    ? [tinyPolygonRect]
    : fillCopperPolygonWithRects(getPourPolygon(pour), maxBoundaryError)
  return copperRects.map((rect) => {
    const rounding =
      Number.EPSILON *
      8 *
      Math.max(
        1,
        Math.abs(rect.center.x) + rect.width / 2,
        Math.abs(rect.center.y) + rect.height / 2,
      )
    return {
      ...rect,
      width: rect.width + 2 * rounding,
      height: rect.height + 2 * rounding,
      type: "rect",
      obstacleId: pour.pcb_copper_pour_id,
      layers: [pour.layer],
      connectedTo,
      // isCopperPour denotes future plane intent, filtered by some stages.
      // Materialized copper must remain an ordinary fixed physical obstacle.
    }
  })
}
