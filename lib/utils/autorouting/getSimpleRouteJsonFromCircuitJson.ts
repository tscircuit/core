import type { SoupUtilObjects } from "@tscircuit/soup-util"
import type { Trace } from "lib/components"
import type { SimpleRouteConnection } from "./SimpleRouteJson"
import type { SimpleRouteJson } from "./SimpleRouteJson"
import { getObstaclesFromSoup } from "@tscircuit/infgrid-ijump-astar"
import type { AnyCircuitElement } from "circuit-json"
import { su } from "@tscircuit/soup-util"
import { getFullConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"

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
}): SimpleRouteJson => {
  if (!db && circuitJson) {
    db = su(circuitJson)
  }

  if (!db) {
    throw new Error("db or circuitJson is required")
  }

  const connMap = getFullConnectivityMapFromCircuitJson(
    (circuitJson ?? db.toArray()).filter(
      (e) =>
        !subcircuit_id ||
        ("subcircuit_id" in e && e.subcircuit_id === subcircuit_id),
    ),
  )

  const obstacles = getObstaclesFromSoup(
    [
      ...db.pcb_component.list(),
      ...db.pcb_smtpad.list(),
      ...db.pcb_plated_hole.list(),
    ].filter((e) => !subcircuit_id || e.subcircuit_id === subcircuit_id),
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

  const bounds = {
    minX: Math.min(...allPoints.map((p) => p.x)) - 1,
    maxX: Math.max(...allPoints.map((p) => p.x)) + 1,
    minY: Math.min(...allPoints.map((p) => p.y)) - 1,
    maxY: Math.max(...allPoints.map((p) => p.y)) + 1,
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

  console.log({ subcircuit_id, nets: db.source_net.list() })
  const source_nets = db.source_net
    .list()
    .filter((e) => !subcircuit_id || e.subcircuit_id === subcircuit_id)

  console.log(source_nets)

  const connections = directTraceConnections

  return {
    bounds,
    obstacles,
    connections,
    layerCount: 2,
    minTraceWidth,
  }
}
