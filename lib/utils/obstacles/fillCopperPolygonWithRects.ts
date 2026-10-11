import Flatten from "@flatten-js/core"
import type { Obstacle } from "./types"

type CopperBoundaryCurve = Flatten.Segment | Flatten.Arc
type CopperRect = Pick<Obstacle, "center" | "width" | "height">

const getCurveXAtY = (curve: CopperBoundaryCurve, y: number) => {
  if (curve instanceof Flatten.Segment) {
    const { start, end } = curve
    return start.x + ((y - start.y) * (end.x - start.x)) / (end.y - start.y)
  }
  // breakToFunctional splits arcs at quadrant boundaries. Each resulting arc
  // has one X value at this Y, on the same circle side as its middle point.
  const direction = curve.middle().x < curve.pc.x ? -1 : 1
  return (
    curve.pc.x +
    direction * Math.sqrt(Math.max(0, curve.r ** 2 - (y - curve.pc.y) ** 2))
  )
}

/**
 * Conservatively covers copper with SRJ rectangles, retaining hole interiors.
 * Polygon coordinates are circuit-world points in mm (+X right, +Y up).
 * No transform is applied. Segment and bulge-arc geometry comes from the
 * existing circuit-json-util pour polygon converter.
 *
 * Bands split at all topology/quadrant changes and then only when a boundary
 * moves more than maxBoundaryError horizontally. Bounding monotone boundaries
 * covers all positive copper; any extra coverage is at most that physical
 * distance from copper. Axis-aligned regions stay exact, regardless of size.
 * Identical neighboring spans merge, avoiding a uniform board-size raster.
 */
export const fillCopperPolygonWithRects = (
  polygon: Flatten.Polygon,
  maxBoundaryError: number,
): CopperRect[] => {
  if (!Number.isFinite(maxBoundaryError) || maxBoundaryError <= 0) {
    throw new Error("Copper boundary error must be a positive distance")
  }
  const curves = Array.from(polygon.edges, (edge: Flatten.Edge) => {
    const curve = edge.shape as CopperBoundaryCurve
    return curve instanceof Flatten.Arc ? curve.breakToFunctional() : [curve]
  }).flat()
  const nonHorizontalCurves = curves.filter(
    (curve) => curve.start.y !== curve.end.y,
  )
  const curveIndex = new Flatten.PlanarSet()
  for (const curve of nonHorizontalCurves) curveIndex.add(curve)
  const yCuts = Array.from(
    new Set(curves.flatMap((curve) => [curve.start.y, curve.end.y])),
  ).sort((a, b) => a - b)
  const rects: CopperRect[] = []
  let previousSpans = new Map<string, CopperRect>()

  const coverBand = (
    minY: number,
    maxY: number,
    bandCurves: CopperBoundaryCurve[],
  ) => {
    const middleY = (minY + maxY) / 2
    if (
      middleY !== minY &&
      middleY !== maxY &&
      bandCurves.some(
        (curve) =>
          Math.abs(getCurveXAtY(curve, minY) - getCurveXAtY(curve, maxY)) >
          maxBoundaryError,
      )
    ) {
      coverBand(minY, middleY, bandCurves)
      coverBand(middleY, maxY, bandCurves)
      return
    }
    const currentSpans = new Map<string, CopperRect>()
    for (
      let curveIndex = 0;
      curveIndex < bandCurves.length - 1;
      curveIndex += 2
    ) {
      const left = bandCurves[curveIndex]!
      const right = bandCurves[curveIndex + 1]!
      const minX = Math.min(getCurveXAtY(left, minY), getCurveXAtY(left, maxY))
      const maxX = Math.max(
        getCurveXAtY(right, minY),
        getCurveXAtY(right, maxY),
      )
      if (maxX <= minX) continue
      const spanKey = `${minX},${maxX}`
      const previousRect = previousSpans.get(spanKey)
      if (
        previousRect &&
        previousRect.center.y + previousRect.height / 2 === minY
      ) {
        const previousMinY = previousRect.center.y - previousRect.height / 2
        previousRect.center.y = (previousMinY + maxY) / 2
        previousRect.height = maxY - previousMinY
        currentSpans.set(spanKey, previousRect)
      } else {
        const rect = {
          center: { x: (minX + maxX) / 2, y: middleY },
          width: maxX - minX,
          height: maxY - minY,
        }
        rects.push(rect)
        currentSpans.set(spanKey, rect)
      }
    }
    previousSpans = currentSpans
  }

  for (let bandIndex = 0; bandIndex < yCuts.length - 1; bandIndex++) {
    const minY = yCuts[bandIndex]!
    const maxY = yCuts[bandIndex + 1]!
    const middleY = (minY + maxY) / 2
    const bandCurves = (
      curveIndex.search(
        Flatten.box(polygon.box.xmin, middleY, polygon.box.xmax, middleY),
      ) as CopperBoundaryCurve[]
    )
      .filter(
        (curve) =>
          Math.min(curve.start.y, curve.end.y) < middleY &&
          Math.max(curve.start.y, curve.end.y) > middleY,
      )
      .sort((a, b) => getCurveXAtY(a, middleY) - getCurveXAtY(b, middleY))
    coverBand(minY, maxY, bandCurves)
  }
  return rects
}
