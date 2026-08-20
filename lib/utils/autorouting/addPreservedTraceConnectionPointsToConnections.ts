import type { ConnectivityMap } from "circuit-json-to-connectivity-map"
import type {
  SimpleRouteConnection,
  SimplifiedPcbTrace,
} from "./SimpleRouteJson"
import { getPreservedTraceConnectionPoints } from "./getPreservedRoutedSubcircuitTraces"

const getElectricalConnectivityKeys = ({
  ids,
  connMap,
}: {
  ids: Array<string | undefined>
  connMap: ConnectivityMap
}) =>
  new Set(
    ids
      .map((id) => (id ? connMap.getNetConnectedToId(id) : null))
      .filter((id): id is string => Boolean(id)),
  )

/**
 * Adds points sampled along electrically matching preserved traces to parent
 * connections. The sampled IDs are already in each trace's `connectsTo`, so
 * the autorouter can choose any of them as an existing-copper attachment.
 */
export const addPreservedTraceConnectionPointsToConnections = ({
  connections,
  preservedTraces,
  connMap,
  excludedConnectionPointIds = new Set(),
}: {
  connections: SimpleRouteConnection[]
  preservedTraces: SimplifiedPcbTrace[]
  connMap: ConnectivityMap
  /**
   * Connections containing one of these points already have an explicit
   * child/parent handoff and must not attach to the child trace elsewhere.
   */
  excludedConnectionPointIds?: ReadonlySet<string>
}): void => {
  const connectionsByElectricalKey = new Map<string, SimpleRouteConnection[]>()
  for (const connection of connections) {
    if (
      connection.pointsToConnect.some(
        (point) =>
          point.pointId && excludedConnectionPointIds.has(point.pointId),
      )
    ) {
      continue
    }

    const electricalKeys = getElectricalConnectivityKeys({
      ids: [
        connection.name,
        connection.source_trace_id,
        ...connection.pointsToConnect.flatMap((point) => [
          point.pointId,
          point.pcb_port_id,
        ]),
      ],
      connMap,
    })
    for (const electricalKey of electricalKeys) {
      const matchingConnections =
        connectionsByElectricalKey.get(electricalKey) ?? []
      matchingConnections.push(connection)
      connectionsByElectricalKey.set(electricalKey, matchingConnections)
    }
  }

  for (const trace of preservedTraces) {
    const electricalKeys = getElectricalConnectivityKeys({
      ids: [
        trace.pcb_trace_id,
        trace.source_trace_id,
        trace.connection_name,
        ...(trace.connectsTo ?? []),
      ],
      connMap,
    })
    const matchingConnections = new Set(
      Array.from(electricalKeys).flatMap(
        (electricalKey) => connectionsByElectricalKey.get(electricalKey) ?? [],
      ),
    )
    if (matchingConnections.size === 0) continue

    const traceConnectionPoints = getPreservedTraceConnectionPoints(trace)
    trace.connectsTo ??= []
    trace.connectsTo.push(
      ...traceConnectionPoints.map((point) => point.pointId),
    )

    for (const connection of matchingConnections) {
      const existingPointIds = new Set(
        connection.pointsToConnect.flatMap((point) =>
          point.pointId ? [point.pointId] : [],
        ),
      )
      for (const point of traceConnectionPoints) {
        if (existingPointIds.has(point.pointId)) continue
        existingPointIds.add(point.pointId)
        connection.pointsToConnect.push(point)
      }
    }
  }
}
