import type { RotatedRect } from "./generateApproximatingRects"

const QUARTER_TURN_TOLERANCE_DEGREES = 0.01

/**
 * The same rect without rotation when `rotatedRect.rotation` (degrees CCW) is
 * within a hundredth of a degree of a quarter turn, otherwise null. Width and
 * height swap for 90 and 270 degrees.
 */
export const getAxisAlignedRectFromRotatedRect = (
  rotatedRect: RotatedRect,
): {
  center: { x: number; y: number }
  width: number
  height: number
} | null => {
  const normalizedRotation = ((rotatedRect.rotation % 360) + 360) % 360
  const axisAlignedAngles = [0, 90, 180, 270] as const

  for (const angle of axisAlignedAngles) {
    const angularDistance = Math.min(
      Math.abs(normalizedRotation - angle),
      360 - Math.abs(normalizedRotation - angle),
    )

    if (angularDistance > QUARTER_TURN_TOLERANCE_DEGREES) continue

    const isVertical = angle === 90 || angle === 270

    return {
      center: rotatedRect.center,
      width: isVertical ? rotatedRect.height : rotatedRect.width,
      height: isVertical ? rotatedRect.width : rotatedRect.height,
    }
  }

  return null
}
