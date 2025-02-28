import type { SoupUtilObjects } from "@tscircuit/soup-util"
import type { Trace } from "lib/components"
import type { SimpleRouteConnection } from "./SimpleRouteJson"
import type { SimpleRouteJson } from "./SimpleRouteJson"
import { getObstaclesFromSoup } from "@tscircuit/infgrid-ijump-astar"
import type { AnyCircuitElement } from "circuit-json"
import { su } from "@tscircuit/soup-util"
import {
  ConnectivityMap,
  getFullConnectivityMapFromCircuitJson,
} from "circuit-json-to-connectivity-map"
import { getDescendantSubcircuitIds } from "./getAncestorSubcircuitIds"

/**
 * This function can only be called in the PcbTraceRender phase or later
 */
export const getSimpleRouteJsonFromCircuitJson = ({
  db,
  circuitJson,
  subcircuit_id,
  minTraceWidth = 0.1,
}: {
  db?: SoupUtilObjects
  circuitJson?: AnyCircuitElement[]
  subcircuit_id?: string | null
  minTraceWidth?: number
}): { simpleRouteJson: SimpleRouteJson; connMap: ConnectivityMap } => {
  if (!db && circuitJson) {
    db = su(circuitJson)
  }

  if (!db) {
    throw new Error("db or circuitJson is required")
  }

  const relevantSubcircuitIds: Set<string> | null = subcircuit_id
    ? new Set([subcircuit_id])
    : null
  if (subcircuit_id) {
    const descendantSubcircuitIds = getDescendantSubcircuitIds(
      db,
      subcircuit_id,
    )
    for (const id of descendantSubcircuitIds) {
      relevantSubcircuitIds!.add(id)
    }
  }

  const subcircuitElements = (circuitJson ?? db.toArray()).filter(
    (e) =>
      !subcircuit_id ||
      ("subcircuit_id" in e && relevantSubcircuitIds!.has(e.subcircuit_id!)),
  )

  const board = db.pcb_board.list()[0]
  db = su(subcircuitElements)

  const connMap = getFullConnectivityMapFromCircuitJson(subcircuitElements)

  const obstacles = getObstaclesFromSoup(
    [
      ...db.pcb_component.list(),
      ...db.pcb_smtpad.list(),
      ...db.pcb_plated_hole.list(),
    ].filter(
      (e) => !subcircuit_id || relevantSubcircuitIds?.has(e.subcircuit_id!),
    ),
    connMap,
  )

  // Calculate bounds
  const allPoints = obstacles.flatMap((o) => [
    {
      x: o.center.x - o.width / 2,
      y: o.center.y - o.height / 2,
    },
    {
      x: o.center.x + o.width / 2,
      y: o.center.y + o.height / 2,
    },
  ])

  let bounds: { minX: number; maxX: number; minY: number; maxY: number }

  if (board) {
    bounds = {
      minX: board.center.x - board.width / 2,
      maxX: board.center.x + board.width / 2,
      minY: board.center.y - board.height / 2,
      maxY: board.center.y + board.height / 2,
    }
  } else {
    bounds = {
      minX: Math.min(...allPoints.map((p) => p.x)) - 1,
      maxX: Math.max(...allPoints.map((p) => p.x)) + 1,
      minY: Math.min(...allPoints.map((p) => p.y)) - 1,
      maxY: Math.max(...allPoints.map((p) => p.y)) + 1,
    }
  }

  // Create connections from traces
  const directTraceConnections = db.source_trace
    .list()
    .map((trace) => {
      const connectedPorts = trace.connected_source_port_ids.map((id) => {
        const source_port = db.source_port.get(id)
        const pcb_port = db.pcb_port.getWhere({ source_port_id: id })
        return {
          ...source_port,
          ...pcb_port,
        }
      })

      if (connectedPorts.length < 2) return null

      // TODO handle trace.connected_source_net_ids

      return {
        name:
          connMap.getNetConnectedToId(trace.source_trace_id) ??
          trace.source_trace_id ??
          "",
        source_trace_id: trace.source_trace_id,
        pointsToConnect: connectedPorts.map((port) => {
          return {
            x: port.x!,
            y: port.y!,
            layer: (port.layers?.[0] as any) ?? "top",
          }
        }),
      } as SimpleRouteConnection
    })
    .filter((c: any): c is SimpleRouteConnection => c !== null)

  const source_nets = db.source_net
    .list()
    .filter(
      (e) => !subcircuit_id || relevantSubcircuitIds?.has(e.subcircuit_id!),
    )

  const connectionsFromNets: SimpleRouteConnection[] = []
  for (const net of source_nets) {
    const connectedSourceTraces = db.source_trace
      .list()
      .filter((st) => st.connected_source_net_ids?.includes(net.source_net_id))

    connectionsFromNets.push({
      name:
        connMap.getNetConnectedToId(net.source_net_id) ?? net.source_net_id!,
      pointsToConnect: connectedSourceTraces.flatMap((st) => {
        const pcb_ports = db.pcb_port
          .list()
          .filter((p) =>
            st.connected_source_port_ids.includes(p.source_port_id),
          )

        return pcb_ports.map((p) => ({
          x: p.x!,
          y: p.y!,
          layer: (p.layers?.[0] as any) ?? "top",
          pcb_port_id: p.pcb_port_id,
        }))
      }),
    })
  }

  return {
    simpleRouteJson: {
      bounds,
      obstacles,
      connections: [...directTraceConnections, ...connectionsFromNets],
      layerCount: 2,
      minTraceWidth,
    },
    connMap,
  }
}
