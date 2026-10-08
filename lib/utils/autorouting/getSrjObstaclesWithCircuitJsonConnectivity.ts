import type { SourceNet, SourceTrace } from "circuit-json"
import type { ConnectivityMap } from "circuit-json-to-connectivity-map"
import type { Obstacle } from "../obstacles/types"

type ObstacleConnectedCircuitJsonId = Obstacle["connectedTo"][number]
type ConnectivityMapKey = NonNullable<
  ReturnType<ConnectivityMap["getNetConnectedToId"]>
>
type SrjSemanticConnectivityId =
  | SourceNet["source_net_id"]
  | SourceTrace["source_trace_id"]
type SrjRouteState = "fresh_route" | "preserved_route"

const getConnectivityMapKey = (
  connectivityMap: ConnectivityMap,
  circuitJsonId: ObstacleConnectedCircuitJsonId,
): ConnectivityMapKey =>
  (connectivityMap.getNetConnectedToId(circuitJsonId) ??
    circuitJsonId) as ConnectivityMapKey

/**
 * Projects Circuit JSON connectivity onto SRJ obstacles.
 *
 * Preserved routes need every equivalent physical ID so existing copper can
 * touch its net. Fresh routes retain each obstacle's own physical ID and only
 * add source-level net and trace IDs used by new SRJ connections.
 */
export const getSrjObstaclesWithCircuitJsonConnectivity = ({
  connectivityMap,
  obstacles,
  routeState,
  sourceNets,
  sourceTraces,
}: {
  connectivityMap: ConnectivityMap
  obstacles: Obstacle[]
  routeState: SrjRouteState
  sourceNets: SourceNet[]
  sourceTraces: SourceTrace[]
}): Obstacle[] => {
  if (routeState === "preserved_route") {
    return obstacles.map((obstacle) => {
      const equivalentCircuitJsonIds = obstacle.connectedTo.flatMap(
        (circuitJsonId) => {
          const connectivityMapKey =
            connectivityMap.getNetConnectedToId(circuitJsonId)
          if (!connectivityMapKey) return []

          return [
            connectivityMapKey,
            ...connectivityMap.getIdsConnectedToNet(connectivityMapKey),
          ]
        },
      )

      return {
        ...obstacle,
        connectedTo: [
          ...new Set([...obstacle.connectedTo, ...equivalentCircuitJsonIds]),
        ],
      }
    })
  }

  const semanticConnectivityIdsByKey = new Map<
    ConnectivityMapKey,
    SrjSemanticConnectivityId[]
  >()
  const semanticConnectivityIds: SrjSemanticConnectivityId[] = [
    ...sourceNets.map((sourceNet) => sourceNet.source_net_id),
    ...sourceTraces.map((sourceTrace) => sourceTrace.source_trace_id),
  ]

  for (const semanticConnectivityId of semanticConnectivityIds) {
    const connectivityMapKey = getConnectivityMapKey(
      connectivityMap,
      semanticConnectivityId,
    )
    const idsForConnectivityMapKey =
      semanticConnectivityIdsByKey.get(connectivityMapKey) ?? []
    idsForConnectivityMapKey.push(semanticConnectivityId)
    semanticConnectivityIdsByKey.set(
      connectivityMapKey,
      idsForConnectivityMapKey,
    )
  }

  return obstacles.map((obstacle) => {
    const semanticConnectivityIds = obstacle.connectedTo.flatMap(
      (circuitJsonId) => {
        const connectivityMapKey = getConnectivityMapKey(
          connectivityMap,
          circuitJsonId,
        )
        return semanticConnectivityIdsByKey.get(connectivityMapKey) ?? []
      },
    )

    return {
      ...obstacle,
      connectedTo: [
        ...new Set([...obstacle.connectedTo, ...semanticConnectivityIds]),
      ],
    }
  })
}
