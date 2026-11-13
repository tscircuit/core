import { getBusSourceTraceIdOrThrow } from "./getBusSourceTraceIdOrThrow"
import { getBusTargetLengthBounds } from "./getBusTargetLengthBounds"
import type { SourceNet, SourceTrace } from "circuit-json"
import type { Bus } from "lib/components/primitive-components/Bus"
import type {
  SimpleRouteBus,
  SimpleRouteConnection,
  SrjConnectionName,
} from "./SimpleRouteJson"

type SubcircuitId = NonNullable<SourceTrace["subcircuit_id"]>
type GetBusesParams = {
  srjConnections: SimpleRouteConnection[]
  buses: Bus[]
  sourceTraces: SourceTrace[]
  subcircuitId?: SubcircuitId | null
  preservedSourceTraceIds?: ReadonlySet<SourceTrace["source_trace_id"]>
  planeTerminatedSourceTraceLayers?: ReadonlyMap<string, ReadonlySet<string>>
  boardLayers: readonly string[]
}

export type FanoutPourNetMap = Readonly<
  Record<string, string | readonly string[]>
>

const getBusSrjConnectionNamesOrThrow = ({
  srjConnections,
  bus,
  sourceTraceId,
  traceNameOrPortSelector,
  busSourceTraces,
}: {
  srjConnections: SimpleRouteConnection[]
  bus: Bus
  sourceTraceId: SourceTrace["source_trace_id"]
  traceNameOrPortSelector: string
  busSourceTraces: SourceTrace[]
}): SrjConnectionName[] => {
  // Branches can share an electrical net but still be distinct bus members.
  // Resolve their own routing connections before falling back to net routing.
  const directSrjConnections = srjConnections.filter(
    (srjConnection) => srjConnection.source_trace_id === sourceTraceId,
  )
  if (directSrjConnections.length > 0) {
    return directSrjConnections.map((srjConnection) => srjConnection.name)
  }

  const sourceTrace = busSourceTraces.find(
    (trace) => trace.source_trace_id === sourceTraceId,
  )!
  const connectedSourceTraces = busSourceTraces.filter(
    (trace) =>
      trace.source_trace_id === sourceTraceId ||
      (sourceTrace.subcircuit_connectivity_map_key !== undefined &&
        trace.subcircuit_connectivity_map_key ===
          sourceTrace.subcircuit_connectivity_map_key),
  )
  const connectedSourceNetIds = new Set(
    connectedSourceTraces.flatMap(
      (trace) => trace.connected_source_net_ids ?? [],
    ),
  )
  const matchingSrjConnections = srjConnections.filter((srjConnection) =>
    connectedSourceNetIds.has(srjConnection.name),
  )

  if (matchingSrjConnections.length === 0) {
    throw new Error(
      `Could not find an SRJ connection for "${traceNameOrPortSelector}" in bus "${bus.name}"`,
    )
  }
  return matchingSrjConnections.map((srjConnection) => srjConnection.name)
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
}): Map<string, Set<string>> => {
  const traceLayers = new Map<string, Set<string>>()
  if (!fanoutPourNetMap) return traceLayers

  const layersBySourceNetId = new Map<string, Set<string>>()
  for (const [layer, netOrNets] of Object.entries(fanoutPourNetMap)) {
    const netNames = Array.isArray(netOrNets) ? netOrNets : [netOrNets]
    for (const netNameOrSelector of netNames) {
      const netName = normalizeNetName(netNameOrSelector)
      for (const sourceNet of sourceNets) {
        if (sourceNet.name !== netName) continue
        const id = sourceNet.source_net_id
        const layers = layersBySourceNetId.get(id) ?? new Set<string>()
        layers.add(layer)
        layersBySourceNetId.set(id, layers)
      }
    }
  }

  for (const sourceTrace of sourceTraces) {
    if (subcircuitId && sourceTrace.subcircuit_id !== subcircuitId) continue
    if (sourceTrace.connected_source_port_ids.length !== 1) continue

    const mappedNets = (sourceTrace.connected_source_net_ids ?? [])
      .map((id) => layersBySourceNetId.get(id))
      .filter((layers): layers is Set<string> => layers !== undefined)
    const [first] = mappedNets
    if (!first) continue
    // A port tied to multiple plane nets must have a common target layer.
    const layers = new Set(
      [...first].filter((layer) =>
        mappedNets.every((candidates) => candidates.has(layer)),
      ),
    )
    if (!layers.size) {
      throw new Error(
        `Source trace "${sourceTrace.name ?? sourceTrace.source_trace_id}" connects to fanout planes on multiple layers`,
      )
    }
    traceLayers.set(sourceTrace.source_trace_id, layers)
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
  preservedSourceTraceIds,
  boardLayers,
}: GetBusesParams): SimpleRouteBus[] | undefined => {
  const declaredSrjBuses: SimpleRouteBus[] = []
  for (const bus of buses) {
    const busSubcircuitId = bus.getSubcircuit().subcircuit_id
    if (subcircuitId && busSubcircuitId !== subcircuitId) continue

    const busSourceTraces = sourceTraces.filter(
      (sourceTrace) => sourceTrace.subcircuit_id === busSubcircuitId,
    )
    const connectionNames = bus._parsedProps.connections.flatMap(
      (traceNameOrPortSelector) => {
        const sourceTraceId = getBusSourceTraceIdOrThrow({
          bus,
          busSourceTraces,
          traceNameOrPortSelector,
        })
        // Fixed copper has no pending SRJ connection; source_bus still keeps
        // every member so routing DRC checks the complete bus.
        if (preservedSourceTraceIds?.has(sourceTraceId)) return []
        return getBusSrjConnectionNamesOrThrow({
          srjConnections,
          bus,
          sourceTraceId,
          traceNameOrPortSelector,
          busSourceTraces,
        })
      },
    )

    if (new Set(connectionNames).size !== connectionNames.length) {
      throw new Error(
        `Bus "${bus.name}" resolves multiple entries to one trace`,
      )
    }

    if (connectionNames.length === 0) continue

    declaredSrjBuses.push({
      busId: bus.name,
      name: bus.name,
      connectionNames,
      ...getBusTargetLengthBounds(bus),
      ...(bus._parsedProps.maxLengthSkew !== undefined
        ? { maxLengthSkew: bus._parsedProps.maxLengthSkew }
        : {}),
      ...(bus._parsedProps.pcbTraceWidth !== undefined
        ? { traceWidth: bus._parsedProps.pcbTraceWidth }
        : {}),
      ...(bus._parsedProps.pcbAllowedLayers !== undefined
        ? { allowedLayers: bus._parsedProps.pcbAllowedLayers }
        : {}),
      ...(bus._parsedProps.preferredLayer !== undefined
        ? { preferredLayer: bus._parsedProps.preferredLayer }
        : {}),
      ...(bus._parsedProps.preferredLayers !== undefined
        ? { preferredLayers: bus._parsedProps.preferredLayers }
        : {}),
    })
  }

  const planeSrjBuses: SimpleRouteBus[] = []
  for (const [sourceTraceId, layers] of planeTerminatedSourceTraceLayers ??
    []) {
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
    const sourceLayer = srjConnection.pointsToConnect[0]!.layer
    const sourceIndex = boardLayers.indexOf(sourceLayer)
    const candidates = boardLayers.filter((layer) => layers.has(layer))
    if (sourceIndex === -1 || candidates.length !== layers.size) {
      throw new Error(
        `Fanout plane trace "${busId}" references a layer outside the board stack`,
      )
    }
    // A drop needs one endpoint. Use physical stack distance, with board
    // order breaking ties independently of how the pour map was authored.
    const layer = candidates.reduce((best, next) =>
      Math.abs(boardLayers.indexOf(next) - sourceIndex) <
      Math.abs(boardLayers.indexOf(best) - sourceIndex)
        ? next
        : best,
    )
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
