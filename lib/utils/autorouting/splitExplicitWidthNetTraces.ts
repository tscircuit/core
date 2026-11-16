import { distance } from "@tscircuit/math-utils"
import type { SourceTrace } from "circuit-json"
import type {
  SimpleRouteConnection,
  SingleLayerConnectionPoint,
  SrjPointId,
} from "./SimpleRouteJson"

type ConnectedTraceRoute = {
  sourceTrace: SourceTrace
  routePoints: SingleLayerConnectionPoint[]
  hintPoints: SingleLayerConnectionPoint[]
  isEligibleForThicknessSplit: boolean
}

const dedupePointsByPointId = (
  points: SingleLayerConnectionPoint[],
): SingleLayerConnectionPoint[] => {
  const seenPointIds = new Set<SrjPointId>()
  return points.filter((point) => {
    if (!point.pointId) return true
    if (seenPointIds.has(point.pointId)) return false
    seenPointIds.add(point.pointId)
    return true
  })
}

/**
 * Keep authored trace thickness on the traces that requested it while the
 * rest of the net inherits the net width. Points are circuit-world mm
 * (+X right, +Y up, +Z above the board); no transform is applied.
 *
 * If splitting would leave fewer than two net points, keep the traces on the
 * net connection and use the largest authored thickness so the net remains
 * routable.
 */
export const splitExplicitWidthNetTraces = ({
  netConnectionName,
  netWidth,
  connectedTraceRoutes,
}: {
  netConnectionName: string
  netWidth: number
  connectedTraceRoutes: ConnectedTraceRoute[]
}): {
  netWidth: number
  netPointsToConnect: SingleLayerConnectionPoint[]
  branchConnections: SimpleRouteConnection[]
} => {
  const explicitThicknessTraceRoutes = connectedTraceRoutes.filter(
    ({ sourceTrace, routePoints, isEligibleForThicknessSplit }) =>
      isEligibleForThicknessSplit &&
      sourceTrace.connected_source_net_ids.length > 0 &&
      sourceTrace.min_trace_thickness !== undefined &&
      sourceTrace.min_trace_thickness !== netWidth &&
      routePoints.length > 0,
  )
  const remainingNetTraceRoutes = connectedTraceRoutes.filter(
    (connectedTraceRoute) =>
      !explicitThicknessTraceRoutes.includes(connectedTraceRoute),
  )
  const netPointsToConnect = dedupePointsByPointId([
    ...remainingNetTraceRoutes.flatMap(({ routePoints }) => routePoints),
    ...remainingNetTraceRoutes.flatMap(({ hintPoints }) => hintPoints),
  ])

  if (netPointsToConnect.length < 2) {
    return {
      netWidth: explicitThicknessTraceRoutes.reduce(
        (width, { sourceTrace }) =>
          Math.max(width, sourceTrace.min_trace_thickness!),
        netWidth,
      ),
      netPointsToConnect: dedupePointsByPointId([
        ...connectedTraceRoutes.flatMap(({ routePoints }) => routePoints),
        ...connectedTraceRoutes.flatMap(({ hintPoints }) => hintPoints),
      ]),
      branchConnections: [],
    }
  }

  const branchConnections = explicitThicknessTraceRoutes.map(
    ({ sourceTrace, routePoints, hintPoints }) => {
      const tracePoints = dedupePointsByPointId([...routePoints, ...hintPoints])
      const origin = tracePoints[0]
      const hubPoint = netPointsToConnect.reduce((nearestPoint, point) =>
        distance(origin, point) < distance(origin, nearestPoint)
          ? point
          : nearestPoint,
      )
      const traceThickness = sourceTrace.min_trace_thickness!
      return {
        name: sourceTrace.source_trace_id,
        source_trace_id: sourceTrace.source_trace_id,
        netConnectionName,
        nominalTraceWidth: traceThickness,
        width: traceThickness,
        pointsToConnect: [...tracePoints, hubPoint],
      }
    },
  )

  return { netWidth, netPointsToConnect, branchConnections }
}
