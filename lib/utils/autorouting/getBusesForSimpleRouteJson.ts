import type { SourceNet, SourcePort, SourceTrace } from "circuit-json"
import type { Bus } from "lib/components/primitive-components/Bus"
import type { Port } from "lib/components/primitive-components/Port/Port"
import type {
  SimpleRouteConnection,
  SimpleRouteBus,
  SrjConnectionName,
} from "./SimpleRouteJson"

type SourcePortId = NonNullable<SourcePort["source_port_id"]>
type SubcircuitId = NonNullable<SourceTrace["subcircuit_id"]>
type SubcircuitConnectivityMapKey = NonNullable<
  SourceTrace["subcircuit_connectivity_map_key"]
>

type GetBusesParams = {
  srjConnections: SimpleRouteConnection[]
  buses: Bus[]
  sourceTraces: SourceTrace[]
  subcircuitId?: SubcircuitId | null
  planeTerminatedSourceTraceLayers?: ReadonlyMap<string, string>
}

export type FanoutPourNetMap = Readonly<
  Record<string, string | readonly string[]>
>

const getBusSourceTraceSubcircuitConnectivityMapKeyOrThrow = ({
  bus,
  busSourceTraces,
  traceNameOrPortSelector,
}: {
  bus: Bus
  busSourceTraces: SourceTrace[]
  traceNameOrPortSelector: string
}): SubcircuitConnectivityMapKey => {
  const sourceTracesWithMatchingName = busSourceTraces.filter(
    (sourceTrace) => sourceTrace.name === traceNameOrPortSelector,
  )
  const selectedPort =
    sourceTracesWithMatchingName.length === 0
      ? bus.getSelectorScope().selectOne<Port>(traceNameOrPortSelector, {
          type: "port",
        })
      : null
  const selectedSourcePortId: SourcePortId | undefined =
    selectedPort?.source_port_id ?? undefined
  const matchingSourceTraces = selectedSourcePortId
    ? busSourceTraces.filter((sourceTrace) =>
        sourceTrace.connected_source_port_ids.includes(selectedSourcePortId),
      )
    : sourceTracesWithMatchingName

  if (matchingSourceTraces.length === 0) {
    throw new Error(
      `Could not find source trace for trace name or port selector "${traceNameOrPortSelector}" in bus "${bus.name}"`,
    )
  }
  if (matchingSourceTraces.length > 1) {
    throw new Error(
      `Trace name or port selector "${traceNameOrPortSelector}" matches multiple source traces in bus "${bus.name}"`,
    )
  }

  const sourceTrace = matchingSourceTraces[0]
  if (!sourceTrace?.subcircuit_connectivity_map_key) {
    throw new Error(
      `Source trace for "${traceNameOrPortSelector}" does not have a subcircuit connectivity map key in bus "${bus.name}"`,
    )
  }

  return sourceTrace.subcircuit_connectivity_map_key
}

const getBusSrjConnectionNameOrThrow = ({
  srjConnections,
  bus,
  busSourceTraces,
  traceSubcircuitConnectivityMapKey,
  traceNameOrPortSelector,
}: {
  srjConnections: SimpleRouteConnection[]
  bus: Bus
  busSourceTraces: SourceTrace[]
  traceSubcircuitConnectivityMapKey: SubcircuitConnectivityMapKey
  traceNameOrPortSelector: string
}): SrjConnectionName => {
  const sourceTraceIds = busSourceTraces
    .filter(
      (sourceTrace) =>
        sourceTrace.subcircuit_connectivity_map_key ===
        traceSubcircuitConnectivityMapKey,
    )
    .map((sourceTrace) => sourceTrace.source_trace_id)
  const matchingSrjConnections = srjConnections.filter(
    (srjConnection) =>
      srjConnection.source_trace_id &&
      sourceTraceIds.includes(srjConnection.source_trace_id),
  )

  if (matchingSrjConnections.length === 0) {
    throw new Error(
      `Could not find an SRJ connection for "${traceNameOrPortSelector}" in bus "${bus.name}"`,
    )
  }
  if (matchingSrjConnections.length > 1) {
    throw new Error(
      `Trace name or port selector "${traceNameOrPortSelector}" matches multiple SRJ connections in bus "${bus.name}"`,
    )
  }

  return matchingSrjConnections[0]!.name
}

const normalizeNetName = (netNameOrSelector: string): string =>
  netNameOrSelector
    .trim()
    .replace(/^net\./, "")
    .replace(/^\./, "")

export const getPlaneTerminatedSourceTraceLayers = ({
  fanoutPourNetMap,
  sourceNets,
  sourceTraces,
  subcircuitId,
}: {
  fanoutPourNetMap?: FanoutPourNetMap
  sourceNets: SourceNet[]
  sourceTraces: SourceTrace[]
  subcircuitId?: SubcircuitId | null
}): Map<string, string> => {
  const traceLayers = new Map<string, string>()
  if (!fanoutPourNetMap) return traceLayers

  const planeLayerBySourceNetId = new Map<string, string>()
  for (const [layer, netOrNets] of Object.entries(fanoutPourNetMap)) {
    const netNames = Array.isArray(netOrNets) ? netOrNets : [netOrNets]
    for (const netNameOrSelector of netNames) {
      const netName = normalizeNetName(netNameOrSelector)
      for (const sourceNet of sourceNets) {
        if (sourceNet.name !== netName) continue
        const previousLayer = planeLayerBySourceNetId.get(
          sourceNet.source_net_id,
        )
        if (previousLayer && previousLayer !== layer) {
          throw new Error(
            `Fanout plane net "${netName}" maps to multiple layers ("${previousLayer}" and "${layer}"); use fanoutPourNetMap to select one`,
          )
        }
        planeLayerBySourceNetId.set(sourceNet.source_net_id, layer)
      }
    }
  }

  for (const sourceTrace of sourceTraces) {
    if (subcircuitId && sourceTrace.subcircuit_id !== subcircuitId) continue
    if (sourceTrace.connected_source_port_ids.length !== 1) continue

    const mappedLayers = new Set(
      (sourceTrace.connected_source_net_ids ?? [])
        .map((sourceNetId) => planeLayerBySourceNetId.get(sourceNetId))
        .filter((layer): layer is string => layer !== undefined),
    )
    if (mappedLayers.size > 1) {
      throw new Error(
        `Source trace "${sourceTrace.name ?? sourceTrace.source_trace_id}" connects to fanout planes on multiple layers`,
      )
    }
    const layer = mappedLayers.values().next().value
    if (layer) traceLayers.set(sourceTrace.source_trace_id, layer)
  }

  return traceLayers
}

/** Converts bus trace names or port selectors into SRJ constraints. */
export const getBusesForSimpleRouteJson = ({
  srjConnections,
  buses,
  sourceTraces,
  subcircuitId,
  planeTerminatedSourceTraceLayers,
}: GetBusesParams): SimpleRouteBus[] | undefined => {
  const declaredSrjBuses: SimpleRouteBus[] = []
  for (const bus of buses) {
    const busSubcircuitId = bus.getSubcircuit().subcircuit_id
    if (subcircuitId && busSubcircuitId !== subcircuitId) continue

    const busSourceTraces = sourceTraces.filter(
      (sourceTrace) => sourceTrace.subcircuit_id === busSubcircuitId,
    )
    const connectionNames = bus._parsedProps.connections.map(
      (traceNameOrPortSelector) => {
        const traceSubcircuitConnectivityMapKey =
          getBusSourceTraceSubcircuitConnectivityMapKeyOrThrow({
            bus,
            busSourceTraces,
            traceNameOrPortSelector,
          })
        return getBusSrjConnectionNameOrThrow({
          srjConnections,
          bus,
          busSourceTraces,
          traceSubcircuitConnectivityMapKey,
          traceNameOrPortSelector,
        })
      },
    )

    if (new Set(connectionNames).size !== connectionNames.length) {
      throw new Error(
        `Bus "${bus.name}" resolves multiple entries to one trace`,
      )
    }

    declaredSrjBuses.push({
      busId: bus.name,
      name: bus.name,
      connectionNames,
    })
  }

  const planeSrjBuses: SimpleRouteBus[] = []
  for (const [sourceTraceId, layer] of planeTerminatedSourceTraceLayers ?? []) {
    const sourceTrace = sourceTraces.find(
      (candidate) => candidate.source_trace_id === sourceTraceId,
    )
    const srjConnection = srjConnections.find(
      (connection) => connection.source_trace_id === sourceTraceId,
    )
    if (!sourceTrace || !srjConnection) continue

    const busId = sourceTrace.name ?? sourceTrace.source_trace_id
    if (
      [...declaredSrjBuses, ...planeSrjBuses].some((bus) => bus.busId === busId)
    ) {
      throw new Error(
        `Fanout plane trace "${busId}" conflicts with an existing bus name`,
      )
    }
    planeSrjBuses.push({
      busId,
      name: busId,
      connectionNames: [srjConnection.name],
      termination: { type: "plane", layer },
    })
  }

  const srjBuses = [...planeSrjBuses, ...declaredSrjBuses]
  return srjBuses.length > 0 ? srjBuses : undefined
}
