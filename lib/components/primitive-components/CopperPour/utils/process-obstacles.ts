import Flatten from "@flatten-js/core"
import type { ConnectivityMap } from "circuit-json-to-connectivity-map"
import type { Obstacle, TraceSegmentObstacle } from "lib/utils/obstacles/types"
import type { Net } from "../../Net"

interface ProcessedObstacles {
  rectObstaclesToSubtract: Flatten.Polygon[]
  circularObstacles: Array<{
    center: { x: number; y: number }
    radius: number
  }>
}

const isTraceSegmentObstacle = (obs: Obstacle): obs is TraceSegmentObstacle => {
  return obs.type === "trace_segment_obstacle"
}

export const processObstaclesForPour = (
  obstacles: Obstacle[],
  connMap: ConnectivityMap,
  net: Net,
  margins: { traceMargin: number; padMargin: number },
): ProcessedObstacles => {
  const rectObstaclesToSubtract: Flatten.Polygon[] = []
  const circularObstacles: Array<{
    center: { x: number; y: number }
    radius: number
  }> = []

  const { traceMargin, padMargin } = margins

  for (const obs of obstacles) {
    const isOnNet = obs.connectedTo.some((id: string) =>
      connMap.areIdsConnected(id, net.source_net_id!),
    )

    if (isOnNet) {
      continue
    }

    if (isTraceSegmentObstacle(obs)) {
      const { center, width, height, rotation } = obs
      const enlargedHeight = height + traceMargin * 2

      const w2 = width / 2
      const h2 = enlargedHeight / 2

      const angleRad = (rotation * Math.PI) / 180
      const cosAngle = Math.cos(angleRad)
      const sinAngle = Math.sin(angleRad)

      const corners = [
        { x: -w2, y: -h2 },
        { x: w2, y: -h2 },
        { x: w2, y: h2 },
        { x: -w2, y: h2 },
      ]

      const rotatedCorners = corners.map((p) => ({
        x: center.x + p.x * cosAngle - p.y * sinAngle,
        y: center.y + p.x * sinAngle + p.y * cosAngle,
      }))

      rectObstaclesToSubtract.push(
        new Flatten.Polygon(
          rotatedCorners.map((p: any) => Flatten.point(p.x, p.y)),
        ),
      )
      const actualMargin = (enlargedHeight - height) / 2
      console.log(
        `[copper-pour] adding trace segment obstacle cutout, wanted_margin: ${traceMargin}, actual_margin: ${actualMargin}`,
      )
      continue
    }

    // For circular plated hole pads
    if (obs.type === "oval" && obs.width === obs.height) {
      // Check if it's a trace end
      const is_trace_end = obs.obstacle_type === "trace"
      const margin = is_trace_end ? traceMargin : padMargin
      const radius = obs.width / 2 + margin
      if (is_trace_end) {
        const actualMargin = radius - obs.width / 2
        console.log(
          `[copper-pour] adding trace end obstacle cutout, wanted_margin: ${margin}, actual_margin: ${actualMargin}`,
        )
      }
      circularObstacles.push({
        center: obs.center,
        radius: radius,
      })
      continue
    }

    // For non-plated holes (which are board-wide obstacles)
    if (
      obs.type === "rect" &&
      obs.width === obs.height &&
      obs.connectedTo.length === 0
    ) {
      const radius = obs.width / 2 // No margin for holes
      circularObstacles.push({
        center: obs.center,
        radius: radius,
      })
      continue
    }

    // For all other obstacles (rectangular pads, oval pads, traces)
    const margin = obs.obstacle_type === "pad" ? padMargin : traceMargin

    const b = new Flatten.Box(
      obs.center.x - obs.width / 2 - margin,
      obs.center.y - obs.height / 2 - margin,
      obs.center.x + obs.width / 2 + margin,
      obs.center.y + obs.height / 2 + margin,
    )
    rectObstaclesToSubtract.push(new Flatten.Polygon(b.toPoints()))
  }

  return { rectObstaclesToSubtract, circularObstacles }
}
