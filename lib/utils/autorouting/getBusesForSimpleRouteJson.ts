import type { SourceNet, SourceTrace } from "circuit-json"
import type { Bus } from "lib/components/primitive-components/Bus"
import {
  getSourceTracesForRoutingConnectionSelector,
  getSrjConnectionsForSourceTraces,
} from "./resolve-routing-connection"
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
  planeTerminatedSourceTraceLayers?: ReadonlyMap<string, string>
}

export type FanoutPourNetMap = Readonly<
  Record<string, string | readonly string[]>
>

const getBusSourceTraceOrThrow = ({
  bus,
  busSourceTraces,
  traceNameOrPortSelector,
}: {
  bus: Bus
  busSourceTraces: SourceTrace[]
  traceNameOrPortSelector: string
}): SourceTrace => {
  const matchingSourceTraces = getSourceTracesForRoutingConnectionSelector({
    subcircuit: bus.getSubcircuit(),
    sourceTraces: busSourceTraces,
    traceNameOrPortSelector,
  })

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
  return sourceTrace
}

const getBusSrjConnectionNamesOrThrow = ({
  srjConnections,
  bus,
  sourceTrace,
  busSourceTraces,
  traceNameOrPortSelector,
}: {
  srjConnections: SimpleRouteConnection[]
  bus: Bus
  sourceTrace: SourceTrace
  busSourceTraces: SourceTrace[]
  traceNameOrPortSelector: string
}): SrjConnectionName[] => {
  const matchingSrjConnections = getSrjConnectionsForSourceTraces({
    selectedSourceTraces: [sourceTrace],
    sourceTraces: busSourceTraces,
    srjConnections,
  })

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
    const connectionNames = bus._parsedProps.connections.flatMap(
      (traceNameOrPortSelector) => {
        const sourceTrace = getBusSourceTraceOrThrow({
          bus,
          busSourceTraces,
          traceNameOrPortSelector,
        })
        return getBusSrjConnectionNamesOrThrow({
          srjConnections,
          bus,
          sourceTrace,
          busSourceTraces,
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
