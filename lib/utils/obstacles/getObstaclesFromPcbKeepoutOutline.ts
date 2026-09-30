import type { PcbKeepoutOutline } from "circuit-json"
import type { PcbComponentId } from "lib/utils/circuit-json/circuit-json-id-types"
import { fillCircleWithRects } from "./fillCircleWithRects"
import { generateApproximatingRects } from "./generateApproximatingRects"
import { getCircumscribedRectFromCircularPcbKeepoutOutline } from "./getCircumscribedRectFromCircularPcbKeepoutOutline"
import type { Obstacle } from "./types"

/**
 * Approximates a rounded stroked keepout path with axis-aligned rectangles.
 * Segment bodies use the existing rotated-rectangle approximation, while
 * vertices use the existing circle-fill approximation for round joins/caps.
 */
export const getObstaclesFromPcbKeepoutOutline = (
  keepout: PcbKeepoutOutline,
  componentId?: PcbComponentId,
): Obstacle[] => {
  const { outline, stroke_width } = keepout
  if (!Number.isFinite(stroke_width) || stroke_width <= 0) return []

  const circularKeepoutRect =
    getCircumscribedRectFromCircularPcbKeepoutOutline(keepout)
  if (circularKeepoutRect) {
    return [
      {
        obstacleId: keepout.pcb_keepout_id,
        componentId,
        type: "rect",
        layers: keepout.layers,
        ...circularKeepoutRect,
        connectedTo: [],
      },
    ]
  }

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

  const isClosed =
    outline.length > 1 &&
    outline[0].x === outline.at(-1)?.x &&
    outline[0].y === outline.at(-1)?.y
  const joinPoints = isClosed ? outline.slice(0, -1) : outline

  for (const [joinIndex, point] of joinPoints.entries()) {
    const approximatingRects = fillCircleWithRects(
      { center: point, radius: stroke_width / 2 },
      { rectHeight: stroke_width / 4 },
    )

    for (const [approximationIndex, rect] of approximatingRects.entries()) {
      obstacles.push({
        obstacleId: `${keepout.pcb_keepout_id}_join_${joinIndex}_rect_${approximationIndex}`,
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
