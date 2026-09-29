import type { PcbKeepoutOutline } from "circuit-json"
import type { PcbComponentId } from "lib/utils/circuit-json/circuit-json-id-types"
import { generateApproximatingRects } from "./generateApproximatingRects"
import type { Obstacle } from "./types"

/**
 * Converts each stroked keepout segment to the axis-aligned rectangles used by
 * the existing rotated-rectangle approximation utility.
 */
export const getObstaclesFromPcbKeepoutOutline = (
  keepout: PcbKeepoutOutline,
  componentId?: PcbComponentId,
): Obstacle[] => {
  const { outline, stroke_width } = keepout
  if (!Number.isFinite(stroke_width) || stroke_width <= 0) return []

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

    const approximatingRects = generateApproximatingRects({
      center: {
        x: (start.x + end.x) / 2,
        y: (start.y + end.y) / 2,
      },
      width: segmentLength,
      height: stroke_width,
      rotation: (Math.atan2(deltaY, deltaX) * 180) / Math.PI,
    })

    for (const [approximationIndex, rect] of approximatingRects.entries()) {
      obstacles.push({
        obstacleId: `${keepout.pcb_keepout_id}_segment_${segmentIndex}_rect_${approximationIndex}`,
        componentId,
        type: "rect",
        layers: keepout.layers,
        ...rect,
        connectedTo: [],
      })
    }
  }

  return obstacles
}
