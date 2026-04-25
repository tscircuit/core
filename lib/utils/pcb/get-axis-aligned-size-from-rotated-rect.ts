export function getAxisAlignedSizeFromRotatedRect({
  width,
  height,
  ccwRotationDegrees,
}: {
  width: number
  height: number
  ccwRotationDegrees: number
}) {
  const angleRad = (ccwRotationDegrees * Math.PI) / 180
  const cosAngle = Math.cos(angleRad)
  const sinAngle = Math.sin(angleRad)

  const w2 = width / 2
  const h2 = height / 2

  const xExtent = Math.abs(w2 * cosAngle) + Math.abs(h2 * sinAngle)
  const yExtent = Math.abs(w2 * sinAngle) + Math.abs(h2 * cosAngle)

  return {
    width: xExtent * 2,
    height: yExtent * 2,
    xExtent,
    yExtent,
  }
}
