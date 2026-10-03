import { getBoundsFromPoints } from "@tscircuit/math-utils"
import ClipperLib from "clipper-lib"
import type { PcbSolderPastePolygon, Point } from "circuit-json"
import { applyToPoint, compose, scale, translate } from "transformation-matrix"

const COORDINATE_SCALE = 1_000_000

/**
 * Returns paste contours in footprint-local mm (+X right, +Y up, right-handed
 * with +Z above). Points pick up placement translation later. Default paste is
 * scaled 0.7 about the bounds center and clipped to copper for concave pads.
 * An explicit margin offsets each edge in mm; erosion may split or remove paste.
 */
export function getPolygonSolderPasteContours({
  points,
  solderPasteMargin,
}: {
  points: Point[]
  solderPasteMargin?: number
}): Pick<PcbSolderPastePolygon, "points" | "holes">[] {
  const copperPath = points.map(({ x, y }) => ({
    X: Math.round(x * COORDINATE_SCALE),
    Y: Math.round(y * COORDINATE_SCALE),
  }))
  const pasteTree = new ClipperLib.PolyTree()
  if (solderPasteMargin !== undefined) {
    const offset = new ClipperLib.ClipperOffset()
    offset.AddPath(
      copperPath,
      ClipperLib.JoinType.jtMiter,
      ClipperLib.EndType.etClosedPolygon,
    )
    offset.Execute(pasteTree, solderPasteMargin * COORDINATE_SCALE)
  } else {
    const bounds = getBoundsFromPoints(points)!
    const centerX = (bounds.minX + bounds.maxX) / 2
    const centerY = (bounds.minY + bounds.maxY) / 2
    const pasteTransform = compose(
      translate(centerX, centerY),
      scale(0.7),
      translate(-centerX, -centerY),
    )
    const pastePath = points.map((point) => {
      const pastePoint = applyToPoint(pasteTransform, point)
      return {
        X: Math.round(pastePoint.x * COORDINATE_SCALE),
        Y: Math.round(pastePoint.y * COORDINATE_SCALE),
      }
    })
    const clipper = new ClipperLib.Clipper()
    clipper.AddPath(pastePath, ClipperLib.PolyType.ptSubject, true)
    clipper.AddPath(copperPath, ClipperLib.PolyType.ptClip, true)
    const clippingSucceeded = clipper.Execute(
      ClipperLib.ClipType.ctIntersection,
      pasteTree,
      ClipperLib.PolyFillType.pftNonZero,
      ClipperLib.PolyFillType.pftNonZero,
    )
    if (!clippingSucceeded)
      throw new Error("Could not clip polygon solder paste to its copper pad")
  }

  const contours: Pick<PcbSolderPastePolygon, "points" | "holes">[] = []
  for (
    let contour = pasteTree.GetFirst();
    contour;
    contour = contour.GetNext()
  ) {
    if (contour.IsHole()) continue
    const pastePoints = contour
      .Contour()
      .map(({ X, Y }) => ({ x: X / COORDINATE_SCALE, y: Y / COORDINATE_SCALE }))
    const holes = contour
      .Childs()
      .filter((child) => child.IsHole())
      .map((hole) =>
        hole.Contour().map(({ X, Y }) => ({
          x: X / COORDINATE_SCALE,
          y: Y / COORDINATE_SCALE,
        })),
      )
    contours.push({ points: pastePoints, ...(holes.length ? { holes } : {}) })
  }
  return contours
}
