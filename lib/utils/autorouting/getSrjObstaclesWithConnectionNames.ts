import type { ConnectivityMap } from "circuit-json-to-connectivity-map"
import type {
  SimpleRouteConnection,
  SrjConnectionName,
} from "./SimpleRouteJson"
import type { Obstacle } from "../obstacles/types"

type ConnectivityNetId = string

export const getSrjObstaclesWithConnectionNames = ({
  connectivityMap,
  connections,
  obstacles,
}: {
  connectivityMap: ConnectivityMap
  connections: SimpleRouteConnection[]
  obstacles: Obstacle[]
}): Obstacle[] => {
  const connectionNamesByConnectivityNetId = new Map<
    ConnectivityNetId,
    Set<SrjConnectionName>
  >()

  for (const connection of connections) {
    const circuitJsonIds = [
      connection.name,
      connection.source_trace_id,
      ...connection.pointsToConnect.flatMap((point) => [
        point.pointId,
        point.pcb_port_id,
      ]),
    ].filter((id): id is string => Boolean(id))

    for (const circuitJsonId of circuitJsonIds) {
      const connectivityNetId =
        connectivityMap.getNetConnectedToId(circuitJsonId)
      if (!connectivityNetId) continue
      const connectionNames =
        connectionNamesByConnectivityNetId.get(connectivityNetId) ??
        new Set<SrjConnectionName>()
      connectionNames.add(connection.name)
      connectionNamesByConnectivityNetId.set(connectivityNetId, connectionNames)
    }
  }

  return obstacles.map((obstacle) => {
    const connectedTo = new Set(obstacle.connectedTo)
    const pcb_port_id = obstacle.circuitJsonMetadata?.pcb_port_id
    if (pcb_port_id) connectedTo.add(pcb_port_id)

    for (const circuitJsonId of obstacle.connectedTo) {
      const connectivityNetId =
        connectivityMap.getNetConnectedToId(circuitJsonId)
      if (!connectivityNetId) continue
      for (const connectionName of connectionNamesByConnectivityNetId.get(
        connectivityNetId,
      ) ?? []) {
        connectedTo.add(connectionName)
      }
    }

    return { ...obstacle, connectedTo: [...connectedTo] }
  })
}
