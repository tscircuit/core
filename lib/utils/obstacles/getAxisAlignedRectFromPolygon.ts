export const getAxisAlignedRectFromPolygon = (
  points: Array<{ x: number; y: number }>,
): {
  center: { x: number; y: number }
  width: number
  height: number
} | null => {
  if (points.length !== 4) return null

  const xs = [...new Set(points.map((point) => point.x))]
  const ys = [...new Set(points.map((point) => point.y))]
  if (xs.length !== 2 || ys.length !== 2) return null

  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const corners = new Set(points.map((point) => `${point.x},${point.y}`))
  const expectedCorners = [
    `${minX},${minY}`,
    `${minX},${maxY}`,
    `${maxX},${minY}`,
    `${maxX},${maxY}`,
  ]

  if (!expectedCorners.every((corner) => corners.has(corner))) return null

  return {
    center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
    width: maxX - minX,
    height: maxY - minY,
  }
}
