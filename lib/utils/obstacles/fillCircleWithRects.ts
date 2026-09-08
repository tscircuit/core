interface Point {
  x: number
  y: number
}

interface Rect {
  center: { x: number; y: number }
  width: number
  height: number
}

/**
 * Fills a circle with axis-aligned rectangles.
 */
export function fillCircleWithRects(
  circle: { center: Point; radius: number },
  options: {
    rectHeight?: number
  } = {},
): Rect[] {
  const { center, radius } = circle
  const { rectHeight = 0.1 } = options
  const rects: Rect[] = []

  // A circle smaller than one band would put its only sample outside the
  // circle (making halfWidth NaN), so cap the band to the circle's diameter.
  const diameter = radius * 2
  const bandHeight = Math.min(rectHeight, diameter)
  if (bandHeight <= 0) return []

  const numSlices = Math.ceil(diameter / bandHeight)

  for (let i = 0; i < numSlices; i++) {
    const y = center.y - radius + (i + 0.5) * bandHeight
    const dy = y - center.y

    // Using circle equation x^2 + y^2 = r^2 to find width at this y
    const halfWidth = Math.sqrt(radius * radius - dy * dy)

    if (halfWidth > 0) {
      rects.push({
        center: {
          x: center.x,
          y: y,
        },
        width: halfWidth * 2,
        height: bandHeight,
      })
    }
  }

  return rects
}
