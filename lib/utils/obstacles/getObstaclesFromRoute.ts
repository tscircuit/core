import type { SimpleRouteJson } from "@tscircuit/props"
import type { Obstacle } from "./types"
import type { LayerRef } from "circuit-json"

export const getObstaclesFromRoute = (
  route: SimpleRouteJson[],
  connectedTo: string[],
): Obstacle[] => {
  const traceObstacles: Obstacle[] = []
  for (let i = 0; i < route.length - 1; i++) {
    const p1 = route[i]
    const p2 = route[i + 1]

    if (p1.route_type !== "wire") {
      continue
    }
    if (!p1.layer) continue

    const segmentWidth = p1.width
    if (segmentWidth === 0) {
      continue
    }

    const segmentLength = Math.hypot(p1.x - p2.x, p1.y - p2.y)

    if (segmentLength === 0) {
      continue
    }

    const centerX = (p1.x + p2.x) / 2
    const centerY = (p1.y + p2.y) / 2
    const rotationDeg = (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI

    const w2 = segmentLength / 2
    const h2 = segmentWidth / 2

    const angleRad = (rotationDeg * Math.PI) / 180
    const cosAngle = Math.cos(angleRad)
    const sinAngle = Math.sin(angleRad)

    const corners = [
      { x: -w2, y: -h2 },
      { x: w2, y: -h2 },
      { x: w2, y: h2 },
      { x: -w2, y: h2 },
    ]

    const rotatedCorners = corners.map((p) => ({
      x: centerX + p.x * cosAngle - p.y * sinAngle,
      y: centerY + p.x * sinAngle + p.y * cosAngle,
    }))

    traceObstacles.push({
      type: "trace_segment_obstacle",
      layers: [p1.layer] as LayerRef[],
      corners: rotatedCorners,
      connectedTo,
      obstacle_type: "trace",
      center: { x: centerX, y: centerY },
      width: segmentLength,
      height: segmentWidth,
      rotation: rotationDeg,
    })

    traceObstacles.push({
      type: "oval",
      layers: [p1.layer] as LayerRef[],
      center: { x: p1.x, y: p1.y },
      width: segmentWidth,
      height: segmentWidth,
      connectedTo,
      obstacle_type: "trace",
    })

    traceObstacles.push({
      type: "oval",
      layers: [p1.layer] as LayerRef[],
      center: { x: p2.x, y: p2.y },
      width: segmentWidth,
      height: segmentWidth,
      connectedTo,
      obstacle_type: "trace",
    })
  }
  return traceObstacles
}
