import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { Trace } from "lib/components"
import type { SimpleRouteConnection } from "./SimpleRouteJson"
import type { SimpleRouteJson } from "./SimpleRouteJson"
import type { AnyCircuitElement } from "circuit-json"
import { su } from "@tscircuit/circuit-json-util"
import {
  ConnectivityMap,
  getFullConnectivityMapFromCircuitJson,
} from "circuit-json-to-connectivity-map"
import { getDescendantSubcircuitIds } from "./getAncestorSubcircuitIds"
import { getObstaclesFromCircuitJson } from "../obstacles/getObstaclesFromCircuitJson"

/**
 * This function can only be called in the PcbTraceRender phase or later
 */
export const getSimpleRouteJsonFromCircuitJson = ({
  db,
  circuitJson,
  subcircuit_id,
  minTraceWidth = 0.1,
}: {
  db?: CircuitJsonUtilObjects
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

  const traceHints = db.pcb_trace_hint.list()

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

  const obstacles = getObstaclesFromCircuitJson(
    [
      ...db.pcb_component.list(),
      ...db.pcb_smtpad.list(),
      ...db.pcb_plated_hole.list(),
      ...db.pcb_hole.list(),
      ...db.pcb_via.list(),
      ...db.pcb_cutout.list(),
      // getObstaclesFromSoup is old and doesn't support diagonal traces
      // ...db.pcb_trace.list(),
    ].filter(
      (e) => !subcircuit_id || relevantSubcircuitIds?.has(e.subcircuit_id!),
    ),
    connMap,
  )

  // Add everything in the connMap to the connectedTo array of each obstacle
  for (const obstacle of obstacles) {
    const additionalIds = obstacle.connectedTo.flatMap((id) =>
      connMap.getIdsConnectedToNet(id),
    )
    obstacle.connectedTo.push(...additionalIds)
  }

  // Calculate bounds
  const allPoints = obstacles
    .flatMap((o) => [
      {
        x: o.center.x - o.width / 2,
        y: o.center.y - o.height / 2,
      },
      {
        x: o.center.x + o.width / 2,
        y: o.center.y + o.height / 2,
      },
    ])
    .concat(board?.outline ?? [])

  let bounds: { minX: number; maxX: number; minY: number; maxY: number }

  if (board && !board.outline) {
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

  if (subcircuit_id) {
    const group = db.pcb_group.getWhere({ subcircuit_id })
    if (group?.width && group.height) {
      const groupBounds = {
        minX: group.center.x - group.width / 2,
        maxX: group.center.x + group.width / 2,
        minY: group.center.y - group.height / 2,
        maxY: group.center.y + group.height / 2,
      }
      bounds = {
        minX: Math.min(bounds.minX, groupBounds.minX),
        maxX: Math.max(bounds.maxX, groupBounds.maxX),
        minY: Math.min(bounds.minY, groupBounds.minY),
        maxY: Math.max(bounds.maxY, groupBounds.maxY),
      }
    }
  }
  const routedTraceIds = new Set(
    db.pcb_trace
      .list()
      .map((t) => t.source_trace_id)
      .filter((id): id is string => Boolean(id)),
  )

  // Create connections from traces
  const directTraceConnections = db.source_trace
    .list()
    .filter((trace) => !routedTraceIds.has(trace.source_trace_id))
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
      const [portA, portB] = connectedPorts
      const layerA = portA.layers?.[0] ?? "top"
      const layerB = portB.layers?.[0] ?? "top"

      // Collect all traceHints that apply to either port
      const matchingHints = traceHints.filter(
        (hint) =>
          hint.pcb_port_id === portA.pcb_port_id ||
          hint.pcb_port_id === portB.pcb_port_id,
      )

      const hintPoints: { x: number; y: number; layer: string }[] = []

      for (const hint of matchingHints) {
        const port = db.pcb_port.get(hint.pcb_port_id)
        const layer = port?.layers?.[0] ?? "top"
        for (const pt of hint.route) {
          hintPoints.push({
            x: pt.x,
            y: pt.y,
            layer,
          })
        }
      }

      return {
        name:
          trace.source_trace_id ??
          connMap.getNetConnectedToId(trace.source_trace_id) ??
          "",
        source_trace_id: trace.source_trace_id,
        pointsToConnect: [
          {
            x: portA.x!,
            y: portA.y!,
            layer: layerA,
            pointId: portA.pcb_port_id,
            pcb_port_id: portA.pcb_port_id,
          },
          ...hintPoints,
          {
            x: portB.x!,
            y: portB.y!,
            layer: layerB,
            pointId: portB.pcb_port_id,
            pcb_port_id: portB.pcb_port_id,
          },
        ],
      } as SimpleRouteConnection
    })
    .filter((c): c is SimpleRouteConnection => c !== null)
  const directTraceConnectionsById = new Map(
    directTraceConnections.map((c) => [c.source_trace_id, c]),
  )

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
      name: net.source_net_id ?? connMap.getNetConnectedToId(net.source_net_id),
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
          pointId: p.pcb_port_id,
          pcb_port_id: p.pcb_port_id,
        }))
      }),
    })
  }

  const breakoutPoints = db.pcb_breakout_point
    .list()
    .filter(
      (bp) => !subcircuit_id || relevantSubcircuitIds?.has(bp.subcircuit_id!),
    )

  const connectionsFromBreakoutPoints: SimpleRouteConnection[] = []
  const breakoutTraceConnectionsById = new Map<string, SimpleRouteConnection>()

  for (const bp of breakoutPoints) {
    const pt = { x: bp.x, y: bp.y, layer: "top" as const }
    if (bp.source_trace_id) {
      const conn =
        directTraceConnectionsById.get(bp.source_trace_id) ??
        breakoutTraceConnectionsById.get(bp.source_trace_id)
      if (conn) {
        conn.pointsToConnect.push(pt)
      } else {
        const newConn: SimpleRouteConnection = {
          name: bp.source_trace_id,
          source_trace_id: bp.source_trace_id,
          pointsToConnect: [pt],
        }
        connectionsFromBreakoutPoints.push(newConn)
        breakoutTraceConnectionsById.set(bp.source_trace_id, newConn)
      }
    } else if (bp.source_net_id) {
      const conn = connectionsFromNets.find((c) => c.name === bp.source_net_id)
      if (conn) {
        conn.pointsToConnect.push(pt)
      } else {
        connectionsFromBreakoutPoints.push({
          name: bp.source_net_id,
          pointsToConnect: [pt],
        })
      }
    } else if ((bp as any).source_port_id) {
      const pcb_port = db.pcb_port.getWhere({
        source_port_id: (bp as any).source_port_id,
      })
      if (pcb_port) {
        connectionsFromBreakoutPoints.push({
          name: (bp as any).source_port_id,
          // direct connection from port to breakout point
          source_trace_id: undefined as any,
          pointsToConnect: [
            {
              x: pcb_port.x!,
              y: pcb_port.y!,
              layer: (pcb_port.layers?.[0] as any) ?? "top",
              pointId: pcb_port.pcb_port_id,
              // @ts-ignore
              pcb_port_id: pcb_port.pcb_port_id,
            },
            pt,
          ],
        })
      }
    }
  }

  // ----- 1. Gather all connections we are about to return
  const allConns: SimpleRouteConnection[] = [
    ...directTraceConnections,
    ...connectionsFromNets,
    ...connectionsFromBreakoutPoints,
  ]

  // ----- 2. Map every pointId -> its parent connection
  const pointIdToConn = new Map<string, SimpleRouteConnection>()
  for (const conn of allConns) {
    for (const pt of conn.pointsToConnect) {
      if (pt.pointId) pointIdToConn.set(pt.pointId, conn)
    }
  }

  // ----- 3. Walk existing pcb_traces to find already-connected port groups
  const existingTraces = db.pcb_trace
    .list()
    .filter(
      (t) => !subcircuit_id || relevantSubcircuitIds?.has(t.subcircuit_id!),
    )

  for (const tr of existingTraces) {
    const tracePortIds = new Set<string>()
    for (const seg of tr.route as any[]) {
      if (seg.start_pcb_port_id) tracePortIds.add(seg.start_pcb_port_id)
      if (seg.end_pcb_port_id) tracePortIds.add(seg.end_pcb_port_id)
    }
    if (tracePortIds.size < 2) continue

    const firstId = tracePortIds.values().next().value
    if (!firstId) continue
    const conn = pointIdToConn.get(firstId)
    if (!conn) continue
    // ensure every port on the trace belongs to the same connection
    if (![...tracePortIds].every((pid) => pointIdToConn.get(pid) === conn))
      continue

    conn.externallyConnectedPointIds ??= []
    conn.externallyConnectedPointIds.push([...tracePortIds])
  }

  return {
    simpleRouteJson: {
      bounds,
      obstacles,
      connections: allConns,
      // TODO add traces so that we don't run into things routed by another
      // subcircuit
      layerCount: board?.num_layers ?? 2,
      minTraceWidth,
      outline: board?.outline?.map((point) => ({ ...point })),
    },
    connMap,
  }
}
