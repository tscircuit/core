import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import { su } from "@tscircuit/circuit-json-util"
import type { AnyCircuitElement, PcbBoard } from "circuit-json"
import {
  ConnectivityMap,
  getFullConnectivityMapFromCircuitJson,
} from "circuit-json-to-connectivity-map"
import { DifferentialPair } from "lib/components/primitive-components/DifferentialPair"
import type { ISubcircuit } from "lib/components/primitive-components/Group/Subcircuit/ISubcircuit"
import { getObstaclesFromCircuitJson } from "../obstacles/getObstaclesFromCircuitJson"
import type {
  SimpleRouteConnection,
  SimpleRouteDifferentialPair,
  SimpleRouteJson,
} from "./SimpleRouteJson"
import { getDescendantSubcircuitIds } from "./getAncestorSubcircuitIds"
import { getDifferentialPairsForSimpleRouteJson } from "./getDifferentialPairsForSimpleRouteJson"
import { getPreservedRoutedSubcircuitTraces } from "./getPreservedRoutedSubcircuitTraces"
import { getUnbrokenCopperPourObstacles } from "./getUnbrokenCopperPourObstacles"

/**
 * This function can only be called in the PcbTraceRender phase or later
 */
export const getSimpleRouteJsonFromCircuitJson = ({
  db,
  circuitJson,
  subcircuit_id,
  minTraceWidth,
  minTraceToPadEdgeClearance,
  minViaEdgeToPadEdgeClearance,
  minViaHoleEdgeToViaHoleEdgeClearance,
  minPlatedHoleDrillEdgeToDrillEdgeClearance,
  minPadEdgeToPadEdgeClearance,
  minBoardEdgeClearance,
  minViaHoleDiameter,
  minViaPadDiameter,
  nominalTraceWidth,
  subcircuitComponent,
  ignoreExistingTopLevelPcbRouteState = false,
}: {
  db?: CircuitJsonUtilObjects
  circuitJson?: AnyCircuitElement[]
  subcircuit_id?: string | null
  minTraceWidth?: number
  nominalTraceWidth?: number
  minTraceToPadEdgeClearance?: number
  minViaEdgeToPadEdgeClearance?: number
  minViaHoleEdgeToViaHoleEdgeClearance?: number
  minPlatedHoleDrillEdgeToDrillEdgeClearance?: number
  minPadEdgeToPadEdgeClearance?: number
  minBoardEdgeClearance?: number
  minViaHoleDiameter?: number
  minViaPadDiameter?: number
  subcircuitComponent?: Pick<ISubcircuit, "selectAll">
  /**
   * Excludes existing root-level PCB route state from a fresh routing problem.
   * Routed child-subcircuit traces and vias remain fixed routing geometry.
   */
  ignoreExistingTopLevelPcbRouteState?: boolean
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

  let board: PcbBoard | undefined | null = null
  let subcircuitIsBoard = false
  if (subcircuit_id) {
    const source_group_id = subcircuit_id.replace(/^subcircuit_/, "")
    const source_board = db.source_board.getWhere({ source_group_id })
    if (source_board) {
      board = db.pcb_board.getWhere({
        source_board_id: source_board.source_board_id,
      })
      if (board) subcircuitIsBoard = true
    }
  }

  if (!board) {
    board = db.pcb_board.list()[0]
  }

  db = su(subcircuitElements)
  const pcbGroup = subcircuit_id
    ? db.pcb_group.getWhere({ subcircuit_id })
    : undefined

  const sharedConnMap =
    getFullConnectivityMapFromCircuitJson(subcircuitElements)

  const breakoutPoints = db.pcb_breakout_point
    .list()
    .filter(
      (bp) => !subcircuit_id || relevantSubcircuitIds?.has(bp.subcircuit_id!),
    )

  const obstacles = getObstaclesFromCircuitJson(
    [
      ...(board ? [board] : []),
      ...db.pcb_component.list(),
      ...db.pcb_smtpad.list(),
      ...db.pcb_plated_hole.list(),
      ...db.pcb_hole.list(),
      // Footprint copper primitives such as solder-jumper bridges are fixed.
      ...db.pcb_trace.list().filter((trace) => !trace.source_trace_id),
      ...db.pcb_via
        .list()
        .filter(
          (via) =>
            !ignoreExistingTopLevelPcbRouteState || Boolean(via.subcircuit_id),
        ),
      ...db.pcb_keepout.list(),
      ...db.pcb_cutout.list(),
    ].filter(
      (e) =>
        e.type === "pcb_board" ||
        !subcircuit_id ||
        relevantSubcircuitIds?.has(e.subcircuit_id!),
    ),
    sharedConnMap,
  )
  obstacles.push(
    ...getUnbrokenCopperPourObstacles({
      connMap: sharedConnMap,
      subcircuitComponent,
      board,
      group: pcbGroup,
    }),
  )

  // SRJ uses two separate fields for routing state:
  // - connections: copper the current autorouter still needs to create.
  // - traces: copper that already exists and must be preserved.
  //
  // Child subcircuits are autorouted before their parent board. Those
  // child routes belong in `traces`, not `connections`; otherwise the parent
  // autorouter receives the same child-internal source_trace as new work and
  // may route it a second time.
  //
  // Keep connectivity metadata on preserved traces so parent routes can
  // legally touch child fanout copper that belongs to the same connected net.
  const preservedRoutedSubcircuitTraces = getPreservedRoutedSubcircuitTraces({
    scopedDb: db,
    currentSubcircuitId: subcircuit_id,
    relevantSubcircuitIds,
    sharedConnMap,
  })

  // Add every equivalent ID from the shared connectivity map to each obstacle.
  for (const obstacle of obstacles) {
    const additionalIds = obstacle.connectedTo.flatMap((id) =>
      sharedConnMap.getIdsConnectedToNet(id),
    )
    obstacle.connectedTo.push(...additionalIds)
  }

  // Build mapping from source_port_id to internal connection ID for interconnects
  const internalConnections = db.source_component_internal_connection.list()
  const sourcePortIdToInternalConnectionId = new Map<string, string>()
  for (const ic of internalConnections) {
    for (const sourcePortId of ic.source_port_ids) {
      sourcePortIdToInternalConnectionId.set(
        sourcePortId,
        ic.source_component_internal_connection_id,
      )
    }
  }

  // Build mapping from pcb_smtpad_id/pcb_plated_hole_id to source_port_id via pcb_port
  const pcbElementIdToSourcePortId = new Map<string, string>()
  for (const pcbPort of db.pcb_port.list()) {
    if (pcbPort.source_port_id) {
      // Find the smtpad or plated hole associated with this port
      const smtpad = db.pcb_smtpad.getWhere({
        pcb_port_id: pcbPort.pcb_port_id,
      })
      if (smtpad) {
        pcbElementIdToSourcePortId.set(
          smtpad.pcb_smtpad_id,
          pcbPort.source_port_id,
        )
      }
      const platedHole = db.pcb_plated_hole.getWhere({
        pcb_port_id: pcbPort.pcb_port_id,
      })
      if (platedHole) {
        pcbElementIdToSourcePortId.set(
          platedHole.pcb_plated_hole_id,
          pcbPort.source_port_id,
        )
      }
    }
  }

  // Set offBoardConnectsTo and netIsAssignable for obstacles that are part of internal connections
  for (const obstacle of obstacles) {
    for (const connectedId of obstacle.connectedTo) {
      const sourcePortId = pcbElementIdToSourcePortId.get(connectedId)
      if (sourcePortId) {
        const internalConnectionId =
          sourcePortIdToInternalConnectionId.get(sourcePortId)
        if (internalConnectionId) {
          obstacle.offBoardConnectsTo = [internalConnectionId]
          obstacle.netIsAssignable = true
          break
        }
      }
    }
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

  // For non-board subcircuits (e.g. breakout regions), the pcb_group
  // defines the routing boundary, not the parent board.
  const useGroupBoundsAsSrjBounds = !!(
    pcbGroup?.width &&
    pcbGroup.height &&
    subcircuit_id &&
    !subcircuitIsBoard
  )

  if (useGroupBoundsAsSrjBounds) {
    bounds = {
      minX: pcbGroup!.center.x - pcbGroup!.width! / 2,
      maxX: pcbGroup!.center.x + pcbGroup!.width! / 2,
      minY: pcbGroup!.center.y - pcbGroup!.height! / 2,
      maxY: pcbGroup!.center.y + pcbGroup!.height! / 2,
    }
  } else if (board && !board.outline) {
    bounds = {
      minX: board.center.x - board.width! / 2,
      maxX: board.center.x + board.width! / 2,
      minY: board.center.y - board.height! / 2,
      maxY: board.center.y + board.height! / 2,
    }
  } else {
    bounds = {
      minX: Math.min(...allPoints.map((p) => p.x)) - 1,
      maxX: Math.max(...allPoints.map((p) => p.x)) + 1,
      minY: Math.min(...allPoints.map((p) => p.y)) - 1,
      maxY: Math.max(...allPoints.map((p) => p.y)) + 1,
    }
  }

  if (pcbGroup?.width && pcbGroup.height && !useGroupBoundsAsSrjBounds) {
    const groupBounds = {
      minX: pcbGroup.center.x - pcbGroup.width / 2,
      maxX: pcbGroup.center.x + pcbGroup.width / 2,
      minY: pcbGroup.center.y - pcbGroup.height / 2,
      maxY: pcbGroup.center.y + pcbGroup.height / 2,
    }
    bounds = {
      minX: Math.min(bounds.minX, groupBounds.minX),
      maxX: Math.max(bounds.maxX, groupBounds.maxX),
      minY: Math.min(bounds.minY, groupBounds.minY),
      maxY: Math.max(bounds.maxY, groupBounds.maxY),
    }
  }
  const sourceTraceIdsAlreadyPreservedAsSrjTraces = new Set(
    db.pcb_trace
      .list()
      .filter((t) => {
        if (!t.source_trace_id) return false

        // While routing one subcircuit, skip source_traces already routed in
        // that same subcircuit. Descendant routed traces are still preserved as
        // fixed SRJ traces above.
        if (subcircuit_id) return t.subcircuit_id === subcircuit_id

        // While routing the board, only skip a source_trace when the existing
        // pcb_trace is the child subcircuit's own routed copy. Cross-boundary
        // or board-owned source_traces must remain routable board connections.
        if (!t.subcircuit_id) return false

        const sourceTrace = db.source_trace.get(t.source_trace_id)
        return sourceTrace?.subcircuit_id === t.subcircuit_id
      })
      .map((t) => t.source_trace_id)
      .filter((id): id is string => Boolean(id)),
  )
  // Build a map of source_port_id → breakout point for adding breakout
  // waypoints to cross-boundary trace connections.
  const sourcePortIdToBreakoutPoint = new Map<
    string,
    (typeof breakoutPoints)[0]
  >()
  for (const bp of breakoutPoints) {
    const spId = (bp as any).source_port_id as string | undefined
    if (spId) sourcePortIdToBreakoutPoint.set(spId, bp)
  }

  // Create connections from source traces in this routing scope. Any
  // source_trace represented by `preservedRoutedSubcircuitTraces` is excluded
  // here so it is preserved as fixed copper instead of re-routed.
  // For cross-boundary traces, add breakout points as additional
  // waypoints so the autorouter routes through the boundary.
  const directTraceConnections = db.source_trace
    .list()
    .filter(
      (trace) =>
        !sourceTraceIdsAlreadyPreservedAsSrjTraces.has(trace.source_trace_id),
    )
    .filter(
      (trace) =>
        !subcircuit_id || (trace as any).subcircuit_id === subcircuit_id,
    )
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

      if (portA.x === undefined || portA.y === undefined) {
        console.error(
          `(source_port_id: ${portA.source_port_id}) for trace ${trace.source_trace_id} does not have x/y coordinates. Skipping this trace.`,
        )
        return null
      }
      if (portB.x === undefined || portB.y === undefined) {
        console.error(
          `(source_port_id: ${portB.source_port_id}) for trace ${trace.source_trace_id} does not have x/y coordinates. Skipping this trace.`,
        )
        return null
      }

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

      // For cross-boundary traces, use the breakout point instead of
      // the matched inner port so the autorouter routes to the breakout
      // boundary, not directly to the inner port.
      const getPortOrBreakoutPoint = (
        port: (typeof connectedPorts)[0],
        layer: string,
        sourcePortId: string,
      ) => {
        const bp = sourcePortIdToBreakoutPoint.get(sourcePortId)
        if (bp && bp.subcircuit_id !== subcircuit_id) {
          return { x: bp.x, y: bp.y, layer }
        }
        return {
          x: port.x!,
          y: port.y!,
          layer,
          pointId: port.pcb_port_id,
          pcb_port_id: port.pcb_port_id,
        }
      }
      return {
        name:
          trace.source_trace_id ??
          sharedConnMap.getNetConnectedToId(trace.source_trace_id) ??
          "",
        source_trace_id: trace.source_trace_id,
        nominalTraceWidth: trace.min_trace_thickness,
        width: trace.min_trace_thickness,
        pointsToConnect: [
          getPortOrBreakoutPoint(
            portA,
            layerA,
            trace.connected_source_port_ids[0],
          ),
          ...hintPoints,
          getPortOrBreakoutPoint(
            portB,
            layerB,
            trace.connected_source_port_ids[1],
          ),
        ],
      } as SimpleRouteConnection
    })
    .filter((c): c is SimpleRouteConnection => c !== null)

  const source_nets = db.source_net
    .list()
    .filter((e) => !subcircuit_id || e.subcircuit_id === subcircuit_id)

  const connectionsFromNets: SimpleRouteConnection[] = []
  const connectionFromNetId = new Map<string, SimpleRouteConnection>()
  const handledNetConnectivityKeys = new Set<string>()

  // The scoped DB includes descendants so their routed copper can be preserved
  // as fixed geometry. That must not make every descendant source trace new
  // routing intent for the current subcircuit. Descendant endpoints are only
  // eligible through an explicit current-scope net reference or exposed-net
  // contract.
  const sourceNetIds = new Set(source_nets.map((net) => net.source_net_id))
  const currentSubcircuitSourceTraces = db.source_trace
    .list()
    .filter((trace) => !subcircuit_id || trace.subcircuit_id === subcircuit_id)
  const exposedBridgeSourceTraceIds = new Set(
    (subcircuitComponent?.selectAll("trace") ?? []).flatMap((trace) => {
      const candidate = trace as {
        source_trace_id?: string | null
        _exposesSubcircuitConnection?: boolean
      }
      return candidate._exposesSubcircuitConnection && candidate.source_trace_id
        ? [candidate.source_trace_id]
        : []
    }),
  )
  const exposedDescendantSourceNetIds = new Set<string>()
  for (const trace of currentSubcircuitSourceTraces) {
    // Subcircuit creates exposed-net bridge traces with this explicit marker.
    // A trace display name is user-facing and must not determine routing scope.
    if (!exposedBridgeSourceTraceIds.has(trace.source_trace_id)) {
      continue
    }
    for (const sourceNetId of trace.connected_source_net_ids ?? []) {
      if (!sourceNetIds.has(sourceNetId)) {
        exposedDescendantSourceNetIds.add(sourceNetId)
      }
    }
  }
  const routedDescendantSourceTraceIds = new Set(
    subcircuit_id
      ? db.pcb_trace
          .list()
          .filter(
            (trace) =>
              trace.subcircuit_id &&
              trace.subcircuit_id !== subcircuit_id &&
              relevantSubcircuitIds?.has(trace.subcircuit_id),
          )
          .map((trace) => trace.source_trace_id)
          .filter((id): id is string => Boolean(id))
      : [],
  )
  const sourceTracesEligibleForNetConnections = db.source_trace
    .list()
    .filter(
      (trace) =>
        // Existing copper must still contribute endpoint connectivity when it
        // belongs to the scope currently being routed. Descendant copper is
        // preserved as static geometry only, preventing it from being routed
        // a second time by its parent.
        !sourceTraceIdsAlreadyPreservedAsSrjTraces.has(trace.source_trace_id) ||
        (subcircuit_id != null && trace.subcircuit_id === subcircuit_id),
    )
    .filter(
      (trace) =>
        !subcircuit_id ||
        trace.subcircuit_id === subcircuit_id ||
        (trace.connected_source_net_ids?.some((id) => sourceNetIds.has(id)) ??
          false) ||
        ((trace.connected_source_net_ids?.some((id) =>
          exposedDescendantSourceNetIds.has(id),
        ) ??
          false) &&
          !routedDescendantSourceTraceIds.has(trace.source_trace_id)),
    )
  const getSourceConnectivityKey = (id?: string | null) =>
    id ? (sharedConnMap.getNetConnectedToId(id) ?? id) : null
  for (const net of source_nets) {
    const netConnectivityKey = getSourceConnectivityKey(net.source_net_id)
    if (
      !netConnectivityKey ||
      handledNetConnectivityKeys.has(netConnectivityKey)
    ) {
      continue
    }
    handledNetConnectivityKeys.add(netConnectivityKey)

    const connectedSourceNetIds = source_nets
      .filter(
        (sourceNet) =>
          getSourceConnectivityKey(sourceNet.source_net_id) ===
          netConnectivityKey,
      )
      .map((sourceNet) => sourceNet.source_net_id)
    const connectedSourceTraces = sourceTracesEligibleForNetConnections.filter(
      (st) =>
        [st.source_trace_id, ...(st.connected_source_net_ids ?? [])].some(
          (id) => getSourceConnectivityKey(id) === netConnectivityKey,
        ),
    )

    let nominalTraceWidthFromConnectedTraces: number | undefined
    for (const sourceTrace of connectedSourceTraces) {
      if (sourceTrace.min_trace_thickness === undefined) continue
      nominalTraceWidthFromConnectedTraces = Math.max(
        nominalTraceWidthFromConnectedTraces ?? 0,
        sourceTrace.min_trace_thickness,
      )
    }

    const pointsToConnect: SimpleRouteConnection["pointsToConnect"] = []
    const addedPointIds = new Set<string>()
    for (const st of connectedSourceTraces) {
      const pcb_ports = db.pcb_port
        .list()
        .filter((p) => st.connected_source_port_ids.includes(p.source_port_id))

      for (const p of pcb_ports) {
        if (addedPointIds.has(p.pcb_port_id)) continue
        addedPointIds.add(p.pcb_port_id)
        pointsToConnect.push({
          x: p.x!,
          y: p.y!,
          layer: (p.layers?.[0] as any) ?? "top",
          pointId: p.pcb_port_id,
          pcb_port_id: p.pcb_port_id,
        })
      }
    }

    const connection: SimpleRouteConnection = {
      name:
        net.source_net_id ??
        sharedConnMap.getNetConnectedToId(net.source_net_id),
      nominalTraceWidth: nominalTraceWidthFromConnectedTraces,
      width: nominalTraceWidthFromConnectedTraces,
      pointsToConnect,
    }
    connectionsFromNets.push(connection)
    for (const sourceNetId of connectedSourceNetIds) {
      connectionFromNetId.set(sourceNetId, connection)
    }
  }

  const connectionsFromBreakoutPoints: SimpleRouteConnection[] = []

  for (const bp of breakoutPoints) {
    const bpSourcePortId = (bp as any).source_port_id as string | undefined
    const pt = { x: bp.x, y: bp.y, layer: "top" as const }

    if (bpSourcePortId) {
      const pcb_port = db.pcb_port.getWhere({
        source_port_id: bpSourcePortId,
      })
      if (!pcb_port) continue

      const portPt = {
        x: pcb_port.x!,
        y: pcb_port.y!,
        layer: (pcb_port.layers?.[0] as any) ?? "top",
        pointId: pcb_port.pcb_port_id,
        pcb_port_id: pcb_port.pcb_port_id,
      }

      // Inner routing (same subcircuit): create [port → bp] so the
      // inner autorouter connects the chip pin to the boundary.
      // Outer routing (parent): the cross-boundary trace already
      // uses the bp instead of the inner port — no connection needed.
      if (bp.subcircuit_id === subcircuit_id) {
        connectionsFromBreakoutPoints.push({
          name: bpSourcePortId,
          source_trace_id: bp.source_trace_id,
          pointsToConnect: [portPt, pt],
        })
        continue
      }

      // Manual breakout point with no cross-boundary trace — create a
      // direct [port, bp] connection as fallback.
      if (!bp.source_trace_id) {
        connectionsFromBreakoutPoints.push({
          name: bpSourcePortId,
          pointsToConnect: [portPt, pt],
        })
      }
      continue
    }

    // Net-based breakout points
    if (bp.source_net_id) {
      const conn = connectionFromNetId.get(bp.source_net_id)
      if (conn) {
        conn.pointsToConnect.push(pt)
      } else {
        connectionsFromBreakoutPoints.push({
          name: bp.source_net_id,
          pointsToConnect: [pt],
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
  const defaultTraceWidth =
    nominalTraceWidth ?? minTraceWidth ?? board?.min_trace_width ?? 0.1
  for (const conn of allConns) {
    conn.nominalTraceWidth ??= defaultTraceWidth
    conn.width ??= defaultTraceWidth
  }

  const differentialPairs: DifferentialPair[] =
    subcircuitComponent?.selectAll<DifferentialPair>("differentialpair") ?? []

  const srjDifferentialPairs: SimpleRouteDifferentialPair[] | undefined =
    getDifferentialPairsForSimpleRouteJson({
      srjConnections: allConns,
      differentialPairs,
      sourceTraces: db.source_trace.list(),
      subcircuitId: subcircuit_id,
    })

  if (subcircuit_id) {
    const pointIdToConn = new Map<string, SimpleRouteConnection>()
    for (const conn of allConns) {
      for (const pt of conn.pointsToConnect) {
        if (pt.pointId) pointIdToConn.set(pt.pointId, conn)
      }
    }

    const existingTraces = db.pcb_trace.list().filter((t) => {
      return relevantSubcircuitIds?.has(t.subcircuit_id!)
    })

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
      if (![...tracePortIds].every((pid) => pointIdToConn.get(pid) === conn)) {
        continue
      }

      conn.externallyConnectedPointIds ??= []
      conn.externallyConnectedPointIds.push([...tracePortIds])
    }
  }

  const resolvedMinViaHoleDiameter =
    minViaHoleDiameter ?? board?.min_via_hole_diameter
  const resolvedMinViaPadDiameter =
    minViaPadDiameter ?? board?.min_via_pad_diameter
  const resolvedMinTraceToPadEdgeClearance =
    minTraceToPadEdgeClearance ?? board?.min_trace_to_pad_edge_clearance
  const resolvedMinViaEdgeToPadEdgeClearance =
    minViaEdgeToPadEdgeClearance ?? board?.min_via_edge_to_pad_edge_clearance
  const resolvedMinViaHoleEdgeToViaHoleEdgeClearance =
    minViaHoleEdgeToViaHoleEdgeClearance ??
    board?.min_via_hole_edge_to_via_hole_edge_clearance
  const resolvedMinPlatedHoleDrillEdgeToDrillEdgeClearance =
    minPlatedHoleDrillEdgeToDrillEdgeClearance ??
    board?.min_plated_hole_drill_edge_to_drill_edge_clearance
  const resolvedMinPadEdgeToPadEdgeClearance =
    minPadEdgeToPadEdgeClearance ?? board?.min_pad_edge_to_pad_edge_clearance
  const resolvedMinBoardEdgeClearance =
    minBoardEdgeClearance ?? board?.min_board_edge_clearance

  return {
    simpleRouteJson: {
      bounds,
      obstacles,
      connections: allConns,
      differentialPairs: srjDifferentialPairs,
      traces:
        preservedRoutedSubcircuitTraces.length > 0
          ? preservedRoutedSubcircuitTraces
          : undefined,
      layerCount: board?.num_layers ?? 2,
      minTraceWidth: Math.min(
        defaultTraceWidth,
        ...allConns.map((c) => c.width!),
      ),
      minViaDiameter: resolvedMinViaPadDiameter,
      minViaHoleDiameter: resolvedMinViaHoleDiameter,
      minViaPadDiameter: resolvedMinViaPadDiameter,
      min_via_hole_diameter: resolvedMinViaHoleDiameter,
      min_via_pad_diameter: resolvedMinViaPadDiameter,
      minTraceToPadEdgeClearance: resolvedMinTraceToPadEdgeClearance,
      minViaEdgeToPadEdgeClearance: resolvedMinViaEdgeToPadEdgeClearance,
      minViaHoleEdgeToViaHoleEdgeClearance:
        resolvedMinViaHoleEdgeToViaHoleEdgeClearance,
      minPlatedHoleDrillEdgeToDrillEdgeClearance:
        resolvedMinPlatedHoleDrillEdgeToDrillEdgeClearance,
      minPadEdgeToPadEdgeClearance: resolvedMinPadEdgeToPadEdgeClearance,
      minBoardEdgeClearance: resolvedMinBoardEdgeClearance,
      nominalTraceWidth,
      outline: board?.outline?.map((point) => ({ ...point })),
    },
    connMap: sharedConnMap,
  }
}
