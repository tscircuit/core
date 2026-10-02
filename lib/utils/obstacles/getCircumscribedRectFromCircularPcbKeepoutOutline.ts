import type { PcbKeepoutOutline } from "circuit-json"
import type { Obstacle } from "./types"

const MINIMUM_CIRCULAR_OUTLINE_POINT_COUNT = 12
const MINIMUM_CIRCULAR_OUTLINE_ASPECT_RATIO = 0.99
const MAXIMUM_RADIUS_VARIATION_RATIO = 0.001

/**
 * Detects a complete circular centerline from board-world points in millimeters
 * (+X right, +Y up, right-handed) and returns the square center point and size
 * in that same frame, including the full stroke.
 */
export const getCircumscribedRectFromCircularPcbKeepoutOutline = (
  keepout: PcbKeepoutOutline,
): Pick<Obstacle, "center" | "width" | "height"> | null => {
  const { outline, stroke_width } = keepout
  const firstPoint = outline[0]
  const lastPoint = outline.at(-1)
  if (!firstPoint || !lastPoint) return null
  if (firstPoint.x !== lastPoint.x || firstPoint.y !== lastPoint.y) return null

  const centerlinePoints = outline.slice(0, -1)
  if (centerlinePoints.length < MINIMUM_CIRCULAR_OUTLINE_POINT_COUNT)
    return null

  const minX = Math.min(...centerlinePoints.map(({ x }) => x))
  const maxX = Math.max(...centerlinePoints.map(({ x }) => x))
  const minY = Math.min(...centerlinePoints.map(({ y }) => y))
  const maxY = Math.max(...centerlinePoints.map(({ y }) => y))
  const centerlineWidth = maxX - minX
  const centerlineHeight = maxY - minY
  const centerlineDiameter = Math.max(centerlineWidth, centerlineHeight)
  if (
    !Number.isFinite(centerlineDiameter) ||
    centerlineDiameter <= 0 ||
    Math.min(centerlineWidth, centerlineHeight) / centerlineDiameter <
      MINIMUM_CIRCULAR_OUTLINE_ASPECT_RATIO
  ) {
    return null
  }

  const center = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }
  const radii = centerlinePoints.map(({ x, y }) =>
    Math.hypot(x - center.x, y - center.y),
  )
  if (
    Math.max(...radii) - Math.min(...radii) >
    centerlineDiameter * MAXIMUM_RADIUS_VARIATION_RATIO
  ) {
    return null
  }

  const angles = centerlinePoints.map(({ x, y }) =>
    Math.atan2(y - center.y, x - center.x),
  )
  const angularSteps = angles.map((angle, angleIndex) => {
    const nextAngle = angles[(angleIndex + 1) % angles.length]!
    return Math.atan2(Math.sin(nextAngle - angle), Math.cos(nextAngle - angle))
  })
  const traversalDirection = Math.sign(angularSteps[0]!)
  if (
    traversalDirection === 0 ||
    angularSteps.some(
      (angularStep) =>
        Math.sign(angularStep) !== traversalDirection ||
        Math.abs(angularStep) > (4 * Math.PI) / centerlinePoints.length,
    )
  ) {
    return null
  }

  const outerDiameter = centerlineDiameter + stroke_width
  return { center, width: outerDiameter, height: outerDiameter }
}
