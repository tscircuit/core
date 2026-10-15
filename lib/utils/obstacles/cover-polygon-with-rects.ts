interface Point {
  x: number
  y: number
}

interface RectBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

/**
 * Conservative cover for one simple polygon ring without holes.
 * Input/output are points in right-handed board world coordinates: x right,
 * y up, all lengths in mm. Rectangles are axis aligned.
 *
 * Split at every vertex height so edge pairing is constant within each band.
 * Cover each trapezoid using its full horizontal envelope. Subdivide to bound
 * horizontal overhang, then merge only identical spans in adjacent bands.
 * Use for cutout obstacles; conductive pad/pour filling has different semantics.
 */
export function coverPolygonWithRects(
  polygon: readonly Point[],
  {
    maxBandHeight = 0.6,
    maxSideOverhang,
  }: { maxBandHeight?: number; maxSideOverhang: number },
) {
  if (polygon.length < 3) return []
  if (!(maxBandHeight > 0) || !(maxSideOverhang > 0)) {
    throw new Error("Polygon coverage dimensions must be positive")
  }

  const vertexHeights = [...new Set(polygon.map((point) => point.y))].sort(
    (a, b) => a - b,
  )
  const edges = polygon
    .map((start, i) => ({ start, end: polygon[(i + 1) % polygon.length]! }))
    .filter(({ start, end }) => start.y !== end.y)
  const xAt = (edge: (typeof edges)[number], y: number) =>
    edge.start.x +
    ((y - edge.start.y) * (edge.end.x - edge.start.x)) /
      (edge.end.y - edge.start.y)
  const rectangles: RectBounds[] = []
  let previousBand: RectBounds[] = []

  for (let band = 0; band + 1 < vertexHeights.length; band++) {
    const bottom = vertexHeights[band]!,
      top = vertexHeights[band + 1]!
    const middle = bottom + (top - bottom) / 2
    const activeEdges = edges
      .filter(
        ({ start, end }) =>
          Math.min(start.y, end.y) <= bottom && Math.max(start.y, end.y) >= top,
      )
      .sort((a, b) => xAt(a, middle) - xAt(b, middle))
    if (activeEdges.length % 2 !== 0)
      throw new Error("Polygon must be a simple ring")
    const maxSideDrift = Math.max(
      0,
      ...activeEdges.map((edge) =>
        Math.abs(xAt(edge, top) - xAt(edge, bottom)),
      ),
    )
    const slices = Math.max(
      1,
      Math.ceil((top - bottom) / maxBandHeight),
      Math.ceil(maxSideDrift / maxSideOverhang),
    )

    for (let slice = 0; slice < slices; slice++) {
      const minY = bottom + ((top - bottom) * slice) / slices
      const maxY =
        slice + 1 === slices
          ? top
          : bottom + ((top - bottom) * (slice + 1)) / slices
      const currentBand: RectBounds[] = []
      for (let pair = 0; pair < activeEdges.length; pair += 2) {
        const left = activeEdges[pair]!,
          right = activeEdges[pair + 1]!
        const minX = Math.min(xAt(left, minY), xAt(left, maxY))
        const maxX = Math.max(xAt(right, minY), xAt(right, maxY))
        if (maxX <= minX) continue
        const previous = previousBand.find(
          (rect) =>
            rect.minX === minX && rect.maxX === maxX && rect.maxY === minY,
        )
        if (previous) {
          previous.maxY = maxY
          currentBand.push(previous)
        } else {
          const rect = { minX, maxX, minY, maxY }
          rectangles.push(rect)
          currentBand.push(rect)
        }
      }
      previousBand = currentBand
    }
  }

  return rectangles.map(({ minX, maxX, minY, maxY }) => ({
    center: { x: minX + (maxX - minX) / 2, y: minY + (maxY - minY) / 2 },
    width: maxX - minX,
    height: maxY - minY,
  }))
}
