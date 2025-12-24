interface Point {
  x: number
  y: number
}

export interface RotatedRect {
  center: Point
  width: number
  height: number
  rotation: number
}

interface Rect {
  center: Point
  width: number
  height: number
}

export function generateApproximatingRects(
  rotatedRect: RotatedRect,
  numRects = 2,
): Rect[] {
  const { center, width, height, rotation } = rotatedRect
  const rects: Rect[] = []

  const angleRad = (rotation * Math.PI) / 180
  const cosAngle = Math.cos(angleRad)
  const sinAngle = Math.sin(angleRad)

  const normalizedRotation = ((rotation % 360) + 360) % 360
  const sliceAlongWidth =
    height <= width
      ? (normalizedRotation >= 45 && normalizedRotation < 135) ||
        (normalizedRotation >= 225 && normalizedRotation < 315)
      : (normalizedRotation >= 135 && normalizedRotation < 225) ||
        normalizedRotation >= 315 ||
        normalizedRotation < 45

  if (sliceAlongWidth) {
    const sliceWidth = width / numRects

    for (let i = 0; i < numRects; i++) {
      const x = (i - numRects / 2 + 0.5) * sliceWidth

      const rotatedX = -x * cosAngle
      const rotatedY = -x * sinAngle

      const coverageWidth = sliceWidth * 1.1
      const coverageHeight =
        Math.abs(height * cosAngle) + Math.abs(sliceWidth * sinAngle)

      rects.push({
        center: {
          x: center.x + rotatedX,
          y: center.y + rotatedY,
        },
        width: coverageWidth,
        height: coverageHeight,
      })
    }
  } else {
    const sliceHeight = height / numRects

    for (let i = 0; i < numRects; i++) {
      const y = (i - numRects / 2 + 0.5) * sliceHeight

      const rotatedX = -y * sinAngle
      const rotatedY = y * cosAngle

      const coverageWidth =
        Math.abs(width * cosAngle) + Math.abs(sliceHeight * sinAngle)
      const coverageHeight = sliceHeight * 1.1

      rects.push({
        center: {
          x: center.x + rotatedX,
          y: center.y + rotatedY,
        },
        width: coverageWidth,
        height: coverageHeight,
      })
    }
  }

  return rects
}
