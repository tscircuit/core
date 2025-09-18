import type { SchematicNetLabel } from "circuit-json"

export interface NetLabelBounds {
  left: number
  right: number
  top: number
  bottom: number
}

/**
 * Calculate the bounding box for a netlabel based on its text and position
 * Uses the same font sizing logic as computeSchematicNetLabelCenter
 */
export const getNetLabelBounds = (
  netlabel: SchematicNetLabel,
  fontSize = 0.18,
): NetLabelBounds => {
  const charWidth = 0.1 * (fontSize / 0.18)
  const width = netlabel.text.length * charWidth
  const height = fontSize

  return {
    left: netlabel.center.x - width / 2,
    right: netlabel.center.x + width / 2,
    top: netlabel.center.y + height / 2,
    bottom: netlabel.center.y - height / 2,
  }
}

/**
 * Calculate the minimum distance needed to move a segment to clear a netlabel
 */
export const calculateRequiredMovement = (
  segment: { from: { x: number; y: number }; to: { x: number; y: number } },
  netlabelBounds: NetLabelBounds,
  clearance = 0.05,
): { direction: "up" | "down" | "left" | "right"; distance: number } | null => {
  // Check if horizontal segment
  if (Math.abs(segment.from.y - segment.to.y) < 0.01) {
    const segmentY = segment.from.y
    const requiredClearanceTop = netlabelBounds.top + clearance
    const requiredClearanceBottom = netlabelBounds.bottom - clearance

    if (segmentY > netlabelBounds.top) {
      return {
        direction: "up",
        distance: requiredClearanceTop - segmentY + 0.01,
      }
    } else if (segmentY < netlabelBounds.bottom) {
      return {
        direction: "down",
        distance: segmentY - requiredClearanceBottom + 0.01,
      }
    } else {
      // Segment is inside, move to closer boundary
      const distanceToTop = requiredClearanceTop - segmentY + 0.01
      const distanceToBottom = segmentY - requiredClearanceBottom + 0.01

      if (distanceToTop < distanceToBottom) {
        return { direction: "up", distance: distanceToTop }
      } else {
        return { direction: "down", distance: distanceToBottom }
      }
    }
  }

  // Check if vertical segment
  if (Math.abs(segment.from.x - segment.to.x) < 0.01) {
    const segmentX = segment.from.x
    const requiredClearanceRight = netlabelBounds.right + clearance
    const requiredClearanceLeft = netlabelBounds.left - clearance

    if (segmentX > netlabelBounds.right) {
      return {
        direction: "right",
        distance: requiredClearanceRight - segmentX + 0.01,
      }
    } else if (segmentX < netlabelBounds.left) {
      return {
        direction: "left",
        distance: segmentX - requiredClearanceLeft + 0.01,
      }
    } else {
      // Segment is inside, move to closer boundary
      const distanceToRight = requiredClearanceRight - segmentX + 0.01
      const distanceToLeft = segmentX - requiredClearanceLeft + 0.01

      if (distanceToRight < distanceToLeft) {
        return { direction: "right", distance: distanceToRight }
      } else {
        return { direction: "left", distance: distanceToLeft }
      }
    }
  }

  // Handle diagonal segments
  // For diagonal traces, determine the best perpendicular movement
  const dx = segment.to.x - segment.from.x
  const dy = segment.to.y - segment.from.y
  const centerX = (segment.from.x + segment.to.x) / 2
  const centerY = (segment.from.y + segment.to.y) / 2

  // Calculate distances to all four boundaries
  const distanceUp = netlabelBounds.top + clearance - centerY + 0.01
  const distanceDown = centerY - (netlabelBounds.bottom - clearance) + 0.01
  const distanceRight = netlabelBounds.right + clearance - centerX + 0.01
  const distanceLeft = centerX - (netlabelBounds.left - clearance) + 0.01

  // Choose movement that's most perpendicular to trace direction
  // and requires least movement
  const movements = [
    { direction: "up", distance: distanceUp },
    { direction: "down", distance: distanceDown },
    { direction: "right", distance: distanceRight },
    { direction: "left", distance: distanceLeft },
  ].filter((m) => m.distance > 0)

  if (movements.length > 0) {
    // Sort by distance and return smallest
    movements.sort((a, b) => a.distance - b.distance)
    return movements[0] as {
      direction: "up" | "down" | "left" | "right"
      distance: number
    }
  }

  return null
}

/**
 * Check if a line segment intersects with a netlabel's bounding box
 */
export const doesSegmentIntersectNetLabel = (
  segment: { from: { x: number; y: number }; to: { x: number; y: number } },
  netlabelBounds: NetLabelBounds,
  clearance = 0.05, // minimum clearance around netlabel
): boolean => {
  const bounds = {
    left: netlabelBounds.left - clearance,
    right: netlabelBounds.right + clearance,
    top: netlabelBounds.top + clearance,
    bottom: netlabelBounds.bottom - clearance,
  }

  // Check if horizontal line segment intersects bounds
  if (Math.abs(segment.from.y - segment.to.y) < 0.01) {
    const segmentY = segment.from.y
    const segmentLeft = Math.min(segment.from.x, segment.to.x)
    const segmentRight = Math.max(segment.from.x, segment.to.x)

    // Use strict inequalities for zero clearance to exclude boundary touches
    if (clearance === 0) {
      return (
        segmentY > bounds.bottom &&
        segmentY < bounds.top &&
        segmentLeft < bounds.right &&
        segmentRight > bounds.left
      )
    } else {
      return (
        segmentY >= bounds.bottom &&
        segmentY <= bounds.top &&
        segmentLeft < bounds.right &&
        segmentRight > bounds.left
      )
    }
  }

  // Check if vertical line segment intersects bounds
  if (Math.abs(segment.from.x - segment.to.x) < 0.01) {
    const segmentX = segment.from.x
    const segmentBottom = Math.min(segment.from.y, segment.to.y)
    const segmentTop = Math.max(segment.from.y, segment.to.y)

    // Use strict inequalities for zero clearance to exclude boundary touches
    if (clearance === 0) {
      return (
        segmentX > bounds.left &&
        segmentX < bounds.right &&
        segmentBottom < bounds.top &&
        segmentTop > bounds.bottom
      )
    } else {
      return (
        segmentX >= bounds.left &&
        segmentX <= bounds.right &&
        segmentBottom < bounds.top &&
        segmentTop > bounds.bottom
      )
    }
  }

  // Handle diagonal lines using line-rectangle intersection
  // Check if any part of the line segment intersects the rectangle
  const lineIntersectsRect = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    left: number,
    top: number,
    right: number,
    bottom: number,
  ): boolean => {
    // Check if either endpoint is inside the rectangle
    // Use strict inequalities for zero clearance to exclude boundary touches
    const isEndpointInside =
      clearance === 0
        ? (x1 > left && x1 < right && y1 > bottom && y1 < top) ||
          (x2 > left && x2 < right && y2 > bottom && y2 < top)
        : (x1 >= left && x1 <= right && y1 >= bottom && y1 <= top) ||
          (x2 >= left && x2 <= right && y2 >= bottom && y2 <= top)

    if (isEndpointInside) {
      return true
    }

    // Check if line intersects any of the four sides of the rectangle
    const lineIntersectsLine = (
      ax1: number,
      ay1: number,
      ax2: number,
      ay2: number,
      bx1: number,
      by1: number,
      bx2: number,
      by2: number,
    ): boolean => {
      const det = (ax2 - ax1) * (by2 - by1) - (bx2 - bx1) * (ay2 - ay1)
      if (Math.abs(det) < 0.0001) return false // Lines are parallel

      const t = ((bx1 - ax1) * (by2 - by1) - (by1 - ay1) * (bx2 - bx1)) / det
      const u = ((bx1 - ax1) * (ay2 - ay1) - (by1 - ay1) * (ax2 - ax1)) / det

      return t >= 0 && t <= 1 && u >= 0 && u <= 1
    }

    // Check intersection with each side of the rectangle
    return (
      lineIntersectsLine(x1, y1, x2, y2, left, bottom, right, bottom) || // Bottom
      lineIntersectsLine(x1, y1, x2, y2, left, top, right, top) || // Top
      lineIntersectsLine(x1, y1, x2, y2, left, bottom, left, top) || // Left
      lineIntersectsLine(x1, y1, x2, y2, right, bottom, right, top) // Right
    )
  }

  return lineIntersectsRect(
    segment.from.x,
    segment.from.y,
    segment.to.x,
    segment.to.y,
    bounds.left,
    bounds.top,
    bounds.right,
    bounds.bottom,
  )
}
