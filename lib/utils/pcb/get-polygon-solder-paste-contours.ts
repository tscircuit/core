import { getBoundsFromPoints } from "@tscircuit/math-utils"
import {
  getManifoldModuleSync,
  type CrossSection,
} from "@tscircuit/manifold-2d"
import type { PcbSolderPastePolygon, Point } from "circuit-json"
import { applyToPoint, compose, scale, translate } from "transformation-matrix"

const signedArea = (points: Point[]) =>
  points.reduce((area, point, index) => {
    const next = points[(index + 1) % points.length]!
    return area + point.x * next.y - next.x * point.y
  }, 0) / 2

/**
 * Returns paste contours in footprint-local mm (+X right, +Y up, right-handed
 * with +Z above). Points receive the pad's placement translation later.
 * Default paste scales 0.7 about the bounds center and is clipped to copper.
 * Explicit margins offset each edge in mm and may split or remove apertures.
 */
export function getPolygonSolderPasteContours({
  points,
  solderPasteMargin,
}: {
  points: Point[]
  solderPasteMargin?: number
}): Pick<PcbSolderPastePolygon, "points" | "holes">[] {
  const manifold = getManifoldModuleSync()
  if (!manifold)
    throw new Error("Polygon solder paste geometry is not initialized")
  const sections: CrossSection[] = []
  try {
    const copper = manifold.CrossSection.ofPolygons(
      [points.map(({ x, y }) => [x, y])],
      "EvenOdd",
    )
    sections.push(copper)
    let paste: CrossSection
    if (solderPasteMargin !== undefined) {
      paste = copper.offset(solderPasteMargin, "Miter")
    } else {
      const bounds = getBoundsFromPoints(points)!
      const centerX = (bounds.minX + bounds.maxX) / 2
      const centerY = (bounds.minY + bounds.maxY) / 2
      const padLocalToPasteLocalTransform = compose(
        translate(centerX, centerY),
        scale(0.7),
        translate(-centerX, -centerY),
      )
      const scaled = manifold.CrossSection.ofPolygons(
        [
          points.map((point) => {
            const { x, y } = applyToPoint(padLocalToPasteLocalTransform, point)
            return [x, y]
          }),
        ],
        "EvenOdd",
      )
      sections.push(scaled)
      paste = scaled.intersect(copper)
    }
    sections.push(paste)
    if (paste.isEmpty()) return []
    const islands = paste.decompose()
    sections.push(...islands)
    return islands.map((island) => {
      const rings = island
        .toPolygons()
        .map((ring) => ring.map(([x, y]) => ({ x, y })))
      // As in the copper-pour solver, the largest ring is the island outline.
      const outline = rings.reduce((largest, ring) =>
        Math.abs(signedArea(ring)) > Math.abs(signedArea(largest))
          ? ring
          : largest,
      )
      const holes = rings.filter((ring) => ring !== outline)
      return { points: outline, ...(holes.length ? { holes } : {}) }
    })
  } finally {
    for (const section of sections) section.delete()
  }
}
