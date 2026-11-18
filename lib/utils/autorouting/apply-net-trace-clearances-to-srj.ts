import type { CircuitJson } from "circuit-json"
import {
  type ConnectivityMap,
  getFullConnectivityMapFromCircuitJson,
} from "circuit-json-to-connectivity-map"
import type { SimpleRouteJson } from "./SimpleRouteJson"

// The connectivity-map package does not export its identifier types.
type ConnectivityMapId = Parameters<ConnectivityMap["getNetConnectedToId"]>[0]

/**
 * Annotates newly created SRJ records without modifying copper geometry.
 * Resolve rules against the complete circuit, so an exposed parent net can
 * constrain child routing. Annotate only the supplied routing scope, including
 * fixed traces and obstacle-only nets with no pending connection.
 */
export function applyNetTraceClearancesToSrj({
  circuitJson,
  connections,
  obstacles,
  traces,
}: {
  circuitJson: CircuitJson
} & Pick<SimpleRouteJson, "connections" | "obstacles" | "traces">): void {
  const sourceNets = circuitJson.filter(
    (element) => element.type === "source_net",
  )
  if (!sourceNets.some((net) => net.min_trace_clearance !== undefined)) return

  const connMap = getFullConnectivityMapFromCircuitJson(circuitJson)
  const minTraceClearanceByConnectedId = new Map<ConnectivityMapId, number>()
  for (const sourceNet of sourceNets) {
    if (sourceNet.min_trace_clearance === undefined) continue
    const netId = connMap.getNetConnectedToId(sourceNet.source_net_id)
    const connectedIds = netId
      ? connMap.getIdsConnectedToNet(netId)
      : [sourceNet.source_net_id]
    for (const connectedId of connectedIds) {
      minTraceClearanceByConnectedId.set(
        connectedId,
        Math.max(
          minTraceClearanceByConnectedId.get(connectedId) ?? 0,
          sourceNet.min_trace_clearance,
        ),
      )
    }
  }

  const getMinTraceClearance = (
    connectedIds: Array<ConnectivityMapId | undefined>,
  ): number | undefined => {
    let minTraceClearance: number | undefined
    for (const connectedId of connectedIds) {
      if (connectedId === undefined) continue
      // Use element IDs, not generated connectivity-net keys: the latter can
      // identify different nets in the full circuit and scoped routing maps.
      const netClearance = minTraceClearanceByConnectedId.get(connectedId)
      if (netClearance === undefined) continue
      minTraceClearance = Math.max(minTraceClearance ?? 0, netClearance)
    }
    return minTraceClearance
  }

  for (const connection of connections) {
    const minTraceClearance = getMinTraceClearance([
      connection.name,
      connection.source_trace_id,
      connection.netConnectionName,
      ...connection.pointsToConnect.map((point) => point.pcb_port_id),
    ])
    if (minTraceClearance !== undefined) {
      connection.minTraceClearance = minTraceClearance
    }
  }
  for (const obstacle of obstacles) {
    const minTraceClearance = getMinTraceClearance(obstacle.connectedTo)
    if (minTraceClearance !== undefined) {
      obstacle.minTraceClearance = minTraceClearance
    }
  }
  for (const trace of traces ?? []) {
    const minTraceClearance = getMinTraceClearance([
      trace.pcb_trace_id,
      trace.connection_name,
    ])
    if (minTraceClearance !== undefined) {
      trace.minTraceClearance = minTraceClearance
    }
  }
}
