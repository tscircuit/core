import Flatten from "@flatten-js/core"
import type { ConnectivityMap } from "circuit-json-to-connectivity-map"
import type { Obstacle } from "lib/utils/autorouting/SimpleRouteJson"
import type { Net } from "../../Net"

interface ProcessedObstacles {
  rectObstaclesToSubtract: Flatten.Polygon[]
  circularObstacles: Array<{
    center: { x: number; y: number }
    radius: number
  }>
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

  for (const obs of obstacles as any[]) {
    const isOnNet = obs.connectedTo.some((id: string) =>
      connMap.areIdsConnected(id, net.source_net_id!),
    )

    if (isOnNet) {
      continue
    }

    // For circular plated hole pads
    if (obs.type === "oval" && obs.width === obs.height) {
      const radius = obs.width / 2 + padMargin
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
    const margin = traceMargin

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
