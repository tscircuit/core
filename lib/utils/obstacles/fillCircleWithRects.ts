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

  const numSlices = Math.ceil((radius * 2) / rectHeight)

  for (let i = 0; i < numSlices; i++) {
    const y = center.y - radius + (i + 0.5) * rectHeight
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
        height: rectHeight,
      })
    }
  }

  return rects
}
