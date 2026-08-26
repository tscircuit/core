import type {
  SimpleRouteConnection,
  SimpleRouteDifferentialPair,
  SimpleRouteJson,
} from "lib/utils/autorouting/SimpleRouteJson"
import { srjPointsReferToSameEndpoint } from "lib/utils/autorouting/compare-srj-points"
import { expandSrjBoundsToIncludeConnectionPoints } from "lib/utils/autorouting/expand-srj-bounds-to-include-connection-points"
import type {
  RoutingPhaseDrcTolerances,
  RoutingPhasePlan,
} from "./GroupRoutingPhasePlan"

export function connectionIsInRoutingPhase(
  connection: SimpleRouteConnection,
  phasePlan: RoutingPhasePlan,
): boolean {
  if (connection.routingPcbGroupId) {
    return connection.routingPcbGroupId === phasePlan.routingPcbGroupId
  }

  for (const trace of phasePlan.traces) {
    if (!trace.source_trace_id) continue
    if (connection.source_trace_id === trace.source_trace_id) return true
    if (connection.name === trace.source_trace_id) return true
    if (connection.rootConnectionName === trace.source_trace_id) return true
    if (connection.mergedConnectionNames?.includes(trace.source_trace_id)) {
      return true
    }
  }

  for (const net of phasePlan.nets) {
    if (!net.source_net_id) continue
    if (connection.name === net.source_net_id) return true
  }

  return false
}

export function Group_hasPhasedAutorouting(
  routingPhasePlans: RoutingPhasePlan[],
): boolean {
  for (const plan of routingPhasePlans) {
    if (plan.routingPcbGroupId) return true
    if (plan.routingPhaseIndex !== null) return true
  }
  return false
}

const getPairedExitTarget = (
  simpleRouteJson: SimpleRouteJson,
  connection: SimpleRouteConnection,
): { x: number; y: number; layer: string } | undefined => {
  if (!connection.routingPcbGroupId || !connection.source_trace_id) {
    return undefined
  }
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
  return pairedPoints.length === 1
    ? {
        x: pairedPoints[0]!.x,
        y: pairedPoints[0]!.y,
        layer: pairedPoints[0]!.layer,
      }
    : undefined
}

export function Group_filterSimpleRouteJsonForPhase(
  simpleRouteJson: SimpleRouteJson,
  phasePlan: RoutingPhasePlan,
): SimpleRouteJson {
  const connections: SimpleRouteConnection[] = []
  for (const connection of simpleRouteJson.connections) {
    if (connectionIsInRoutingPhase(connection, phasePlan)) {
      connections.push(connection)
    }
  }

  const includedConnectionNames: Set<string> = new Set()
  for (const connection of connections) {
    includedConnectionNames.add(connection.name)
  }

  const differentialPairs: SimpleRouteDifferentialPair[] = []
  for (const differentialPair of simpleRouteJson.differentialPairs ?? []) {
    const positiveConnectionIncluded: boolean = includedConnectionNames.has(
      differentialPair.connectionNames[0],
    )
    const negativeConnectionIncluded: boolean = includedConnectionNames.has(
      differentialPair.connectionNames[1],
    )
    if (positiveConnectionIncluded !== negativeConnectionIncluded) {
      throw new Error(
        `Differential pair "${differentialPair.connectionNames.join("/")}" cannot be split across autorouting phases`,
      )
    }
    if (positiveConnectionIncluded) differentialPairs.push(differentialPair)
  }

  const connectionByName = new Map(
    connections.map((connection) => [connection.name, connection]),
  )

  const buses = (simpleRouteJson.buses ?? [])
    .map((bus) => {
      const connectionNames = bus.connectionNames.filter((connectionName) =>
        includedConnectionNames.has(connectionName),
      )
      const connectionExitTargets = Object.fromEntries(
        connectionNames.flatMap((connectionName) => {
          const connection = connectionByName.get(connectionName)
          if (!connection) return []
          const pairedTarget = getPairedExitTarget(simpleRouteJson, connection)
          return pairedTarget ? [[connectionName, pairedTarget]] : []
        }),
      )
      return {
        ...bus,
        connectionNames,
        ...(Object.keys(connectionExitTargets).length > 0
          ? { connectionExitTargets }
          : {}),
      }
    })
    .filter((bus) => bus.connectionNames.length > 0)

  const bounds = expandSrjBoundsToIncludeConnectionPoints({
    bounds: phasePlan.routingBounds ?? simpleRouteJson.bounds,
    connections,
  })

  return {
    ...simpleRouteJson,
    bounds,
    connections,
    differentialPairs:
      differentialPairs.length > 0 ? differentialPairs : undefined,
    buses: buses.length > 0 ? buses : undefined,
  }
}

function hasDrcTolerances(
  drcTolerances: RoutingPhaseDrcTolerances | undefined,
): drcTolerances is RoutingPhaseDrcTolerances {
  if (!drcTolerances) return false
  return Object.values(drcTolerances).some((value) => value !== undefined)
}

function applyMinTraceWidthToConnections(
  connections: SimpleRouteConnection[],
  minTraceWidth: number | undefined,
): SimpleRouteConnection[] {
  if (minTraceWidth === undefined) return connections

  return connections.map((connection) => ({
    ...connection,
    nominalTraceWidth: Math.max(
      connection.nominalTraceWidth ?? minTraceWidth,
      minTraceWidth,
    ),
    width: Math.max(connection.width ?? minTraceWidth, minTraceWidth),
  }))
}

export function Group_applyDrcTolerancesToSimpleRouteJson(
  simpleRouteJson: SimpleRouteJson,
  drcTolerances: RoutingPhaseDrcTolerances | undefined,
): SimpleRouteJson {
  if (!hasDrcTolerances(drcTolerances)) return simpleRouteJson

  const minTraceWidth =
    drcTolerances.minTraceWidth ?? simpleRouteJson.minTraceWidth
  const minViaHoleDiameter =
    drcTolerances.minViaHoleDiameter ?? simpleRouteJson.minViaHoleDiameter
  const minViaPadDiameter =
    drcTolerances.minViaPadDiameter ?? simpleRouteJson.minViaPadDiameter
  const minTraceToPadEdgeClearance =
    drcTolerances.minTraceToPadEdgeClearance ??
    simpleRouteJson.minTraceToPadEdgeClearance
  const minViaEdgeToPadEdgeClearance =
    drcTolerances.minViaEdgeToPadEdgeClearance ??
    simpleRouteJson.minViaEdgeToPadEdgeClearance
  const minViaHoleEdgeToViaHoleEdgeClearance =
    drcTolerances.minViaHoleEdgeToViaHoleEdgeClearance ??
    simpleRouteJson.minViaHoleEdgeToViaHoleEdgeClearance
  const minPlatedHoleDrillEdgeToDrillEdgeClearance =
    drcTolerances.minPlatedHoleDrillEdgeToDrillEdgeClearance ??
    simpleRouteJson.minPlatedHoleDrillEdgeToDrillEdgeClearance
  const minPadEdgeToPadEdgeClearance =
    drcTolerances.minPadEdgeToPadEdgeClearance ??
    simpleRouteJson.minPadEdgeToPadEdgeClearance
  const minBoardEdgeClearance =
    drcTolerances.minBoardEdgeClearance ?? simpleRouteJson.minBoardEdgeClearance

  return {
    ...simpleRouteJson,
    connections: applyMinTraceWidthToConnections(
      simpleRouteJson.connections,
      drcTolerances.minTraceWidth,
    ),
    minTraceWidth,
    minViaDiameter: minViaPadDiameter,
    minViaHoleDiameter,
    minViaPadDiameter,
    min_via_hole_diameter: minViaHoleDiameter,
    min_via_pad_diameter: minViaPadDiameter,
    minTraceToPadEdgeClearance,
    minViaEdgeToPadEdgeClearance,
    minViaHoleEdgeToViaHoleEdgeClearance,
    minPlatedHoleDrillEdgeToDrillEdgeClearance,
    minPadEdgeToPadEdgeClearance,
    minBoardEdgeClearance,
  }
}
