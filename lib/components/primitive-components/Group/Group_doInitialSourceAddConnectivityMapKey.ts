import { ConnectivityMap } from "circuit-json-to-connectivity-map"
import type { Group } from "./Group"
import type { SourceTrace } from "circuit-json"
import type { TraceI } from "../Trace/TraceI"
import type { Via } from "../Via"

export function Group_doInitialSourceAddConnectivityMapKey(group: Group<any>) {
  if (!group.isSubcircuit) return
  const { db } = group.root!
  // Find all traces that belong to this subcircuit, generate a connectivity
  // map, and add source_trace.subcircuit_connectivity_map_key
  const traces = group.selectAll("trace") as TraceI[]
  const vias = group.selectAll("via") as Via[]
  const nets = group.selectAll("net") as any[]
  const traceSourceTraceIds = new Set(
    traces
      .map((trace) => trace.source_trace_id)
      .filter((sourceTraceId): sourceTraceId is string =>
        Boolean(sourceTraceId),
      ),
  )
  const sourceTraces = [
    ...traces
      .map(
        (trace) => db.source_trace.get(trace.source_trace_id!) as SourceTrace,
      )
      .filter((sourceTrace): sourceTrace is SourceTrace =>
        Boolean(sourceTrace),
      ),
    ...db.source_trace
      .list()
      .filter(
        (sourceTrace) =>
          sourceTrace.subcircuit_id === group.subcircuit_id &&
          !traceSourceTraceIds.has(sourceTrace.source_trace_id),
      ),
  ]
  const connMap = new ConnectivityMap({})
  connMap.addConnections(
    sourceTraces.map((sourceTrace) => [
      sourceTrace.source_trace_id,
      ...sourceTrace.connected_source_port_ids,
      ...sourceTrace.connected_source_net_ids,
    ]),
  )

  // Add source_nets to the connectivity map so vias and other components
  // can find their connectivity even without traces
  const sourceNets = db.source_net
    .list()
    .filter((net) => net.subcircuit_id === group.subcircuit_id)
  for (const sourceNet of sourceNets) {
    connMap.addConnections([[sourceNet.source_net_id]])
  }

  const { name: subcircuitName } = group._parsedProps
  const exposedNetKeyBySourceNetId = new Map<string, string>()

  // Update source_trace.subcircuit_connectivity_map_key
  for (const sourceTrace of sourceTraces) {
    const connNetId = connMap.getNetConnectedToId(sourceTrace.source_trace_id)
    if (!connNetId) continue
    const connectivityMapKey = `${subcircuitName ?? `unnamedsubcircuit${group.subcircuit_id ?? group.source_group_id ?? group._renderId}`}_${connNetId}`
    db.source_trace.update(sourceTrace.source_trace_id, {
      subcircuit_connectivity_map_key: connectivityMapKey,
    })

    const trace = traces.find(
      (trace) => trace.source_trace_id === sourceTrace.source_trace_id,
    )
    if (trace) trace.subcircuit_connectivity_map_key = connectivityMapKey

    if (sourceTrace.name?.startsWith("exposed_net.")) {
      for (const sourceNetId of sourceTrace.connected_source_net_ids) {
        exposedNetKeyBySourceNetId.set(sourceNetId, connectivityMapKey)
      }
    }
  }

  // Update source_port.subcircuit_connectivity_map_key for ports connected to the same net
  const allSourcePortIds = new Set<string>()
  for (const sourceTrace of sourceTraces) {
    for (const id of sourceTrace.connected_source_port_ids) {
      allSourcePortIds.add(id)
    }
  }

  for (const portId of allSourcePortIds) {
    const connNetId = connMap.getNetConnectedToId(portId)
    if (!connNetId) continue
    const connectivityMapKey = `${subcircuitName ?? `unnamedsubcircuit${group.subcircuit_id ?? group.source_group_id ?? group._renderId}`}_${connNetId}`
    db.source_port.update(portId, {
      subcircuit_connectivity_map_key: connectivityMapKey,
    })
  }

  // Update source_net.subcircuit_connectivity_map_key for all nets in this subcircuit
  // Start with nets connected through traces
  const allSourceNetIds = new Set<string>()
  for (const sourceTrace of sourceTraces) {
    for (const source_net_id of sourceTrace.connected_source_net_ids) {
      allSourceNetIds.add(source_net_id)
    }
  }

  // Also include all source_nets in this subcircuit (even if not connected via traces)
  for (const sourceNet of sourceNets) {
    allSourceNetIds.add(sourceNet.source_net_id)
  }

  for (const netId of allSourceNetIds) {
    const connNetId = connMap.getNetConnectedToId(netId)
    if (!connNetId) continue
    const connectivityMapKey = `${subcircuitName ?? `unnamedsubcircuit${group.subcircuit_id ?? group.source_group_id ?? group._renderId}`}_${connNetId}`
    db.source_net.update(netId, {
      subcircuit_connectivity_map_key: connectivityMapKey,
    })

    // Also update the Net instance directly
    const netInstance = nets.find((n) => n.source_net_id === netId)
    if (netInstance) {
      netInstance.subcircuit_connectivity_map_key = connectivityMapKey
    }
  }

  for (const [sourceNetId, connectivityMapKey] of exposedNetKeyBySourceNetId) {
    db.source_net.update(sourceNetId, {
      subcircuit_connectivity_map_key: connectivityMapKey,
    })

    const netInstance = nets.find((n) => n.source_net_id === sourceNetId)
    if (netInstance) {
      netInstance.subcircuit_connectivity_map_key = connectivityMapKey
    }

    for (const sourceTrace of db.source_trace.list()) {
      if (!sourceTrace.connected_source_net_ids.includes(sourceNetId)) continue

      db.source_trace.update(sourceTrace.source_trace_id, {
        subcircuit_connectivity_map_key: connectivityMapKey,
      })

      const trace = traces.find(
        (trace) => trace.source_trace_id === sourceTrace.source_trace_id,
      )
      if (trace) trace.subcircuit_connectivity_map_key = connectivityMapKey

      for (const sourcePortId of sourceTrace.connected_source_port_ids) {
        db.source_port.update(sourcePortId, {
          subcircuit_connectivity_map_key: connectivityMapKey,
        })
      }
    }
  }

  // Update Via.subcircuit_connectivity_map_key for vias
  for (const via of vias) {
    // Find the Net or Trace connected to this via
    const connectedNetOrTrace = via._getConnectedNetOrTrace()
    if (!connectedNetOrTrace) continue

    // Copy the connectivity map key directly from the Net or Trace instance
    if (connectedNetOrTrace.subcircuit_connectivity_map_key) {
      via.subcircuit_connectivity_map_key =
        connectedNetOrTrace.subcircuit_connectivity_map_key
    }
  }
}
