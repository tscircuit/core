const AXIS_ALIGNED_RECT_TOLERANCE_MM = 1e-3

export const getAxisAlignedRectFromPolygon = (
  points: Array<{ x: number; y: number }>,
): {
  center: { x: number; y: number }
  width: number
  height: number
} | null => {
  const isCloseTo = (a: number, b: number) =>
    Math.abs(a - b) <= AXIS_ALIGNED_RECT_TOLERANCE_MM
  const normalizedPoints = points.filter(
    (point, index) =>
      index === 0 ||
      !isCloseTo(point.x, points[index - 1].x) ||
      !isCloseTo(point.y, points[index - 1].y),
  )

  if (
    normalizedPoints.length > 1 &&
    isCloseTo(normalizedPoints[0].x, normalizedPoints.at(-1)!.x) &&
    isCloseTo(normalizedPoints[0].y, normalizedPoints.at(-1)!.y)
  ) {
    normalizedPoints.pop()
  }

  if (normalizedPoints.length < 4) return null

  const minX = Math.min(...normalizedPoints.map((point) => point.x))
  const maxX = Math.max(...normalizedPoints.map((point) => point.x))
  const minY = Math.min(...normalizedPoints.map((point) => point.y))
  const maxY = Math.max(...normalizedPoints.map((point) => point.y))
  const expectedCorners = [
    { x: minX, y: minY },
    { x: minX, y: maxY },
    { x: maxX, y: minY },
    { x: maxX, y: maxY },
  ]

  if (
    !normalizedPoints.every(
      (point) =>
        isCloseTo(point.x, minX) ||
        isCloseTo(point.x, maxX) ||
        isCloseTo(point.y, minY) ||
        isCloseTo(point.y, maxY),
    ) ||
    !expectedCorners.every((corner) =>
      normalizedPoints.some(
        (point) => isCloseTo(point.x, corner.x) && isCloseTo(point.y, corner.y),
      ),
    )
  ) {
    return null
  }

  return {
    center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
    width: maxX - minX,
    height: maxY - minY,
  }
}
