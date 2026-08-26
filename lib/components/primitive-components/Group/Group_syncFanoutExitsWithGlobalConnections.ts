import type {
  SimpleRouteConnection,
  SimpleRouteDifferentialPair,
  SimpleRouteJson,
  SimpleRoutePoint,
} from "lib/utils/autorouting/SimpleRouteJson"
import {
  srjPointsHaveSameBoardPositionAndLayer,
  srjPointsHaveSamePointId,
  srjPointsReferToSameEndpoint,
} from "lib/utils/autorouting/compare-srj-points"
import type { RoutingPhasePlan } from "./GroupRoutingPhasePlan"

const removeCompletedFanoutConnections = (
  simpleRouteJson: SimpleRouteJson,
  routingPcbGroupId: string,
): SimpleRouteJson => {
  const connections = simpleRouteJson.connections.filter(
    (connection) => connection.routingPcbGroupId !== routingPcbGroupId,
  )
  const includedConnectionNames = new Set(
    connections.map((connection) => connection.name),
  )
  const differentialPairs: SimpleRouteDifferentialPair[] = []
  for (const differentialPair of simpleRouteJson.differentialPairs ?? []) {
    const positiveConnectionIncluded = includedConnectionNames.has(
      differentialPair.connectionNames[0],
    )
    const negativeConnectionIncluded = includedConnectionNames.has(
      differentialPair.connectionNames[1],
    )
    if (positiveConnectionIncluded !== negativeConnectionIncluded) {
      throw new Error(
        `Differential pair "${differentialPair.connectionNames.join("/")}" cannot be split at a breakout boundary`,
      )
    }
    if (positiveConnectionIncluded) differentialPairs.push(differentialPair)
  }

  const buses = (simpleRouteJson.buses ?? [])
    .map((bus) => ({
      ...bus,
      connectionNames: bus.connectionNames.filter((connectionName) =>
        includedConnectionNames.has(connectionName),
      ),
    }))
    .filter((bus) => bus.connectionNames.length > 0)

  return {
    ...simpleRouteJson,
    connections,
    differentialPairs:
      differentialPairs.length > 0 ? differentialPairs : undefined,
    buses: buses.length > 0 ? buses : undefined,
  }
}

export interface SynchronizedBreakoutPoint {
  sourceTraceId: string
  routingPcbGroupId: string
  previousPoint: SimpleRoutePoint
  fanoutExitPoint: SimpleRoutePoint
}

export function Group_syncFanoutExitsWithGlobalConnections({
  fanoutInputSimpleRouteJson,
  fanoutOutputSimpleRouteJson,
  baseSimpleRouteJson,
  routingPhasePlan,
}: {
  fanoutInputSimpleRouteJson: SimpleRouteJson
  fanoutOutputSimpleRouteJson: SimpleRouteJson
  baseSimpleRouteJson: SimpleRouteJson
  routingPhasePlan: RoutingPhasePlan
}): {
  downstreamSimpleRouteJson: SimpleRouteJson
  baseSimpleRouteJson: SimpleRouteJson
  synchronizedBreakoutPoints: SynchronizedBreakoutPoint[]
} {
  const routingPcbGroupId = routingPhasePlan.routingPcbGroupId
  if (!routingPcbGroupId) {
    return {
      downstreamSimpleRouteJson: fanoutOutputSimpleRouteJson,
      baseSimpleRouteJson,
      synchronizedBreakoutPoints: [],
    }
  }

  const outputConnectionByName = new Map(
    fanoutOutputSimpleRouteJson.connections.map((connection) => [
      connection.name,
      connection,
    ]),
  )
  const baseConnections: SimpleRouteConnection[] =
    baseSimpleRouteJson.connections.map((connection) => ({
      ...connection,
      pointsToConnect: connection.pointsToConnect.map((point) => ({
        ...point,
      })),
    }))
  const synchronizedBreakoutPoints: SynchronizedBreakoutPoint[] = []

  for (const inputConnection of fanoutInputSimpleRouteJson.connections) {
    if (
      inputConnection.routingPcbGroupId !== routingPcbGroupId ||
      !inputConnection.source_trace_id
    ) {
      continue
    }
    const outputConnection = outputConnectionByName.get(inputConnection.name)
    if (!outputConnection) continue

    const globalConnection = baseConnections.find((connection) => {
      if (connection.routingPcbGroupId === routingPcbGroupId) return false

      const sharesSourceTrace =
        connection.source_trace_id === inputConnection.source_trace_id
      const sharesPointId = connection.pointsToConnect.some((globalPoint) =>
        inputConnection.pointsToConnect.some((inputPoint) =>
          srjPointsHaveSamePointId(globalPoint, inputPoint),
        ),
      )
      if (!sharesSourceTrace && !sharesPointId) return false

      return connection.pointsToConnect.some((globalPoint) =>
        inputConnection.pointsToConnect.some((inputPoint) =>
          srjPointsReferToSameEndpoint(globalPoint, inputPoint),
        ),
      )
    })
    if (!globalConnection) continue

    const previousGlobalPointIndex = globalConnection.pointsToConnect.findIndex(
      (globalPoint) =>
        inputConnection.pointsToConnect.some((inputPoint) =>
          srjPointsReferToSameEndpoint(globalPoint, inputPoint),
        ),
    )
    if (previousGlobalPointIndex < 0) continue
    const previousPoint =
      globalConnection.pointsToConnect[previousGlobalPointIndex]

    const changedPointIndex = outputConnection.pointsToConnect.findIndex(
      (outputPoint, pointIndex) => {
        const inputPoint = inputConnection.pointsToConnect[pointIndex]
        return (
          inputPoint !== undefined &&
          !srjPointsHaveSameBoardPositionAndLayer(outputPoint, inputPoint)
        )
      },
    )
    if (changedPointIndex < 0) continue
    const fanoutExitPoint = outputConnection.pointsToConnect[changedPointIndex]

    const {
      layers: _previousLayers,
      terminalVia: _previousTerminalVia,
      ...previousPointWithoutLayerOverrides
    } = previousPoint
    const synchronizedGlobalPoint: SimpleRoutePoint = {
      ...previousPointWithoutLayerOverrides,
      x: fanoutExitPoint.x,
      y: fanoutExitPoint.y,
      layer: fanoutExitPoint.layer,
      ...(fanoutExitPoint.layers
        ? { layers: [...fanoutExitPoint.layers] }
        : {}),
      ...(fanoutExitPoint.terminalVia
        ? { terminalVia: { ...fanoutExitPoint.terminalVia } }
        : {}),
    }
    globalConnection.pointsToConnect[previousGlobalPointIndex] =
      synchronizedGlobalPoint
    synchronizedBreakoutPoints.push({
      sourceTraceId: inputConnection.source_trace_id,
      routingPcbGroupId,
      previousPoint,
      fanoutExitPoint,
    })
  }

  // FanoutAutorouter replaces the completed source footprint's individual pad
  // obstacles with one keepout. Mirror that transformation into the base SRJ
  // used by later phases, while leaving fanout copper represented by traces.
  const newFanoutSourceKeepouts = fanoutOutputSimpleRouteJson.obstacles.filter(
    (obstacle) =>
      obstacle.isFanoutSourceKeepout === true &&
      obstacle.componentId !== undefined,
  )
  const completedSourceComponentIds = new Set(
    newFanoutSourceKeepouts.flatMap((obstacle) =>
      obstacle.componentId === undefined ? [] : [obstacle.componentId],
    ),
  )
  const retainedBaseObstacles = baseSimpleRouteJson.obstacles.filter(
    (obstacle) =>
      !obstacle.componentId ||
      !completedSourceComponentIds.has(obstacle.componentId),
  )
  return {
    downstreamSimpleRouteJson: removeCompletedFanoutConnections(
      fanoutOutputSimpleRouteJson,
      routingPcbGroupId,
    ),
    baseSimpleRouteJson: {
      ...baseSimpleRouteJson,
      connections: baseConnections,
      obstacles: [...retainedBaseObstacles, ...newFanoutSourceKeepouts],
    },
    synchronizedBreakoutPoints,
  }
}
