import type { PcbKeepoutOutline } from "circuit-json"
import type { Obstacle } from "./types"

/**
 * Converts a stroked Circuit JSON keepout path into Simple Route JSON
 * obstacles. Input and output geometry use PCB world coordinates in mm, with
 * +x right, +y up, and counterclockwise-positive rotations. Outline entries
 * and obstacle centers are points, so no coordinate-frame transform is needed.
 */
export const getObstaclesFromPcbKeepoutOutline = (
  keepout: PcbKeepoutOutline,
  componentId?: string,
): Obstacle[] => {
  const { outline, stroke_width: strokeWidth } = keepout
  if (!Number.isFinite(strokeWidth) || strokeWidth <= 0) return []

  const obstacles: Obstacle[] = []
  for (
    let segmentIndex = 0;
    segmentIndex < outline.length - 1;
    segmentIndex++
  ) {
    const start = outline[segmentIndex]
    const end = outline[segmentIndex + 1]
    const deltaX = end.x - start.x
    const deltaY = end.y - start.y
    const segmentLength = Math.hypot(deltaX, deltaY)
    if (!Number.isFinite(segmentLength) || segmentLength === 0) continue

    obstacles.push({
      obstacleId: `${keepout.pcb_keepout_id}_segment_${segmentIndex}`,
      componentId,
      type: "rect",
      layers: keepout.layers,
      center: {
        x: (start.x + end.x) / 2,
        y: (start.y + end.y) / 2,
      },
      // Extend each segment by one stroke width so adjacent SRJ rectangles
      // overlap at angled joins instead of leaving routing gaps.
      width: segmentLength + strokeWidth,
      height: strokeWidth,
      ccwRotationDegrees: (Math.atan2(deltaY, deltaX) * 180) / Math.PI,
      connectedTo: [],
    })
  }

  return obstacles
}
