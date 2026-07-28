const EPSILON = 1e-9

/**
 * Decomposes a simple polygon into axis-aligned rects contained by it.
 *
 * The polygon is sliced into vertical slabs bounded by consecutive vertex x
 * coordinates, so no vertex lies inside a slab and the inside spans are bounded
 * by straight edges across it. Spans are sampled just inside each slab boundary
 * and extrapolated back to the exact boundary (the bounding edges are linear
 * across the slab), so every emitted rect is contained by the polygon up to
 * float rounding. The decomposition is exact for rectilinear polygons (leadless
 * pads with notched or stepped corners, at any 90°-family rotation); for other
 * simple polygons it is a conservative partial cover.
 *
 * `minRectDim` drops rects with any dimension under the given size. Slabs
 * bounded by two converging edges (the tip of a polygonised circle) or by
 * float noise after a 90° rotation otherwise degenerate to slivers that are
 * artifacts of the sweep rather than geometry.
 */
export function getRectsInsidePolygon(
  points: { x: number; y: number }[],
  opts: { minRectDim?: number } = {},
): { x: number; y: number; width: number; height: number }[] {
  if (points.length < 3) return []
  const minRectDim = opts.minRectDim ?? 0

  const xs = Array.from(new Set(points.map((p) => p.x))).sort((a, b) => a - b)
  const rects: { x: number; y: number; width: number; height: number }[] = []

  for (let i = 0; i < xs.length - 1; i++) {
    const left = xs[i]!
    const right = xs[i + 1]!
    const width = right - left
    if (width <= EPSILON || width < minRectDim) continue

    const sampleInset = width * 1e-6
    const xLeft = left + sampleInset
    const xRight = right - sampleInset
    if (!(xLeft > left && xRight < right && xLeft < xRight)) continue
    const leftSpans = getInsideSpansAtX(points, xLeft)
    const rightSpans = getInsideSpansAtX(points, xRight)
    if (leftSpans.length !== rightSpans.length) continue

    // Extrapolation factor from the sampled x back to the slab boundary.
    const k = sampleInset / (xRight - xLeft)

    for (let spanIndex = 0; spanIndex < leftSpans.length; spanIndex++) {
      const bottomLeft = leftSpans[spanIndex]![0]
      const bottomRight = rightSpans[spanIndex]![0]
      const topLeft = leftSpans[spanIndex]![1]
      const topRight = rightSpans[spanIndex]![1]

      // Span bounds at exactly x=left and x=right; taking the tighter side
      // keeps the rect inside both bounding edges across the whole slab.
      const bottom = Math.max(
        bottomLeft - (bottomRight - bottomLeft) * k,
        bottomRight + (bottomRight - bottomLeft) * k,
      )
      const top = Math.min(
        topLeft - (topRight - topLeft) * k,
        topRight + (topRight - topLeft) * k,
      )
      const height = top - bottom
      if (height <= EPSILON || height < minRectDim) continue

      rects.push({
        x: left + width / 2,
        y: (bottom + top) / 2,
        width,
        height,
      })
    }
  }

  return rects
}

function getInsideSpansAtX(
  points: { x: number; y: number }[],
  x: number,
): [number, number][] {
  const crossings: number[] = []

  for (let i = 0; i < points.length; i++) {
    const start = points[i]!
    const end = points[(i + 1) % points.length]!
    if (x <= Math.min(start.x, end.x) || x >= Math.max(start.x, end.x)) continue
    crossings.push(
      start.y + ((x - start.x) / (end.x - start.x)) * (end.y - start.y),
    )
  }

  crossings.sort((a, b) => a - b)

  const spans: [number, number][] = []
  for (let i = 0; i + 1 < crossings.length; i += 2) {
    spans.push([crossings[i]!, crossings[i + 1]!])
  }
  return spans
}
