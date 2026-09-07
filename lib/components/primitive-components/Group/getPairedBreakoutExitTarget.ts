import type {
  SimpleRouteConnection,
  SimpleRouteJson,
  SimpleRoutePoint,
} from "lib/utils/autorouting/SimpleRouteJson"
import { srjPointsReferToSameEndpoint } from "lib/utils/autorouting/compare-srj-points"

const getPairedGlobalPoint = (
  simpleRouteJson: SimpleRouteJson,
  connection: SimpleRouteConnection,
): SimpleRoutePoint | undefined => {
  const globalConnection = simpleRouteJson.connections.find(
    (candidate) =>
      candidate.routingPcbGroupId !== connection.routingPcbGroupId &&
      candidate.source_trace_id === connection.source_trace_id &&
      candidate.pointsToConnect.some((globalPoint) =>
        connection.pointsToConnect.some((localPoint) =>
          srjPointsReferToSameEndpoint(globalPoint, localPoint),
        ),
      ),
  )
  if (!globalConnection) return undefined

  const pairedPoints = globalConnection.pointsToConnect.filter(
    (globalPoint) =>
      !connection.pointsToConnect.some((localPoint) =>
        srjPointsReferToSameEndpoint(globalPoint, localPoint),
      ),
  )
  return pairedPoints.length === 1 ? pairedPoints[0] : undefined
}

export const getPairedBreakoutExitTarget = (
  simpleRouteJson: SimpleRouteJson,
  connection: SimpleRouteConnection,
): { x: number; y: number; layer: string } | undefined => {
  if (!connection.routingPcbGroupId || !connection.source_trace_id) {
    return undefined
  }

  const pairedGlobalPoint = getPairedGlobalPoint(simpleRouteJson, connection)
  if (!pairedGlobalPoint) return undefined

  const pairedPointBelongsToAnotherBreakout = simpleRouteJson.connections.some(
    (candidate) =>
      candidate.routingPcbGroupId !== undefined &&
      candidate.routingPcbGroupId !== connection.routingPcbGroupId &&
      candidate.source_trace_id === connection.source_trace_id &&
      candidate.pointsToConnect.some((candidatePoint) =>
        srjPointsReferToSameEndpoint(candidatePoint, pairedGlobalPoint),
      ),
  )
  if (!pairedPointBelongsToAnotherBreakout) return undefined

  return {
    x: pairedGlobalPoint.x,
    y: pairedGlobalPoint.y,
    layer: pairedGlobalPoint.layer,
  }
}
