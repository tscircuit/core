import type { PcbKeepoutOutline } from "circuit-json"
import type { PcbComponentId } from "lib/utils/circuit-json/circuit-json-id-types"
import { getCircumscribedRectFromCircularPcbKeepoutOutline } from "./getCircumscribedRectFromCircularPcbKeepoutOutline"
import type { Obstacle } from "./types"

/**
 * Represents a rounded stroked keepout path with native rotated rectangles.
 * Vertices use the same circumscribed-square representation as circular
 * keepouts so downstream routers can normalize the geometry when needed.
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

    obstacles.push({
      obstacleId: `${keepout.pcb_keepout_id}_segment_${segmentIndex}`,
      componentId,
      type: "rect",
      layers: keepout.layers,
      center: {
        x: (start.x + end.x) / 2,
        y: (start.y + end.y) / 2,
      },
      width: segmentLength,
      height: stroke_width,
      ccwRotationDegrees: (Math.atan2(deltaY, deltaX) * 180) / Math.PI,
      connectedTo: [],
    })
  }

  const isClosed =
    outline.length > 1 &&
    outline[0].x === outline.at(-1)?.x &&
    outline[0].y === outline.at(-1)?.y
  const joinPoints = isClosed ? outline.slice(0, -1) : outline

  for (const [joinIndex, point] of joinPoints.entries()) {
    obstacles.push({
      obstacleId: `${keepout.pcb_keepout_id}_join_${joinIndex}`,
      componentId,
      type: "rect",
      layers: keepout.layers,
      center: point,
      width: stroke_width,
      height: stroke_width,
      connectedTo: [],
    })
  }

  return obstacles
}
