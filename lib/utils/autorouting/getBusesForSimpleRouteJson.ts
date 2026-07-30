import type { SourcePort, SourceTrace } from "circuit-json"
import type { Bus } from "lib/components/primitive-components/Bus"
import type { Port } from "lib/components/primitive-components/Port/Port"
import type {
  SimpleRouteConnection,
  SimpleRouteBus,
  SrjConnectionName,
} from "./SimpleRouteJson"

type SourcePortId = NonNullable<SourcePort["source_port_id"]>
type SubcircuitId = NonNullable<SourceTrace["subcircuit_id"]>
type GetBusesParams = {
  srjConnections: SimpleRouteConnection[]
  buses: Bus[]
  sourceTraces: SourceTrace[]
  subcircuitId?: SubcircuitId | null
}

const getBusSourceTraceOrThrow = ({
  bus,
  busSourceTraces,
  traceNameOrPortSelector,
}: {
  bus: Bus
  busSourceTraces: SourceTrace[]
  traceNameOrPortSelector: string
}): SourceTrace => {
  const sourceTracesWithMatchingName = busSourceTraces.filter(
    (sourceTrace) => sourceTrace.name === traceNameOrPortSelector,
  )
  const selectedPort =
    sourceTracesWithMatchingName.length === 0
      ? bus.getSubcircuit().selectOne<Port>(traceNameOrPortSelector, {
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

  const sourceTrace = matchingSourceTraces[0]!
  if (!sourceTrace.subcircuit_connectivity_map_key) {
    throw new Error(
      `Source trace for "${traceNameOrPortSelector}" does not have a subcircuit connectivity map key in bus "${bus.name}"`,
    )
  }

  return sourceTrace
}

const getBusSrjConnectionNameOrThrow = ({
  srjConnections,
  bus,
  busSourceTraces,
  sourceTrace,
  traceNameOrPortSelector,
}: {
  srjConnections: SimpleRouteConnection[]
  bus: Bus
  busSourceTraces: SourceTrace[]
  sourceTrace: SourceTrace
  traceNameOrPortSelector: string
}): SrjConnectionName => {
  const exactSrjConnections = srjConnections.filter(
    (srjConnection) =>
      srjConnection.source_trace_id === sourceTrace.source_trace_id,
  )
  if (exactSrjConnections.length === 1) {
    return exactSrjConnections[0]!.name
  }
  if (exactSrjConnections.length > 1) {
    throw new Error(
      `Trace name or port selector "${traceNameOrPortSelector}" matches multiple SRJ connections in bus "${bus.name}"`,
    )
  }

  const connectivityMapKey = sourceTrace.subcircuit_connectivity_map_key
  const sourceTraceIds = busSourceTraces
    .filter(
      (candidateSourceTrace) =>
        candidateSourceTrace.subcircuit_connectivity_map_key ===
        connectivityMapKey,
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

export const getPlaneTerminatedBusSourceTraceIds = ({
  buses,
  sourceTraces,
  subcircuitId,
}: Pick<
  GetBusesParams,
  "buses" | "sourceTraces" | "subcircuitId"
>): Set<string> => {
  const sourceTraceIds = new Set<string>()
  for (const bus of buses) {
    if (bus._parsedProps.fanoutTermination?.type !== "plane") continue

    const busSubcircuitId = bus.getSubcircuit().subcircuit_id
    if (subcircuitId && busSubcircuitId !== subcircuitId) continue

    const busSourceTraces = sourceTraces.filter(
      (sourceTrace) => sourceTrace.subcircuit_id === busSubcircuitId,
    )
    for (const traceNameOrPortSelector of bus._parsedProps.connections) {
      sourceTraceIds.add(
        getBusSourceTraceOrThrow({
          bus,
          busSourceTraces,
          traceNameOrPortSelector,
        }).source_trace_id,
      )
    }
  }
  return sourceTraceIds
}

/** Converts bus trace names or port selectors into SRJ constraints. */
export const getBusesForSimpleRouteJson = ({
  srjConnections,
  buses,
  sourceTraces,
  subcircuitId,
}: GetBusesParams): SimpleRouteBus[] | undefined => {
  const srjBuses: SimpleRouteBus[] = []
  for (const bus of buses) {
    const busSubcircuitId = bus.getSubcircuit().subcircuit_id
    if (subcircuitId && busSubcircuitId !== subcircuitId) continue

    const busSourceTraces = sourceTraces.filter(
      (sourceTrace) => sourceTrace.subcircuit_id === busSubcircuitId,
    )
    const connectionNames = bus._parsedProps.connections.map(
      (traceNameOrPortSelector) => {
        const sourceTrace = getBusSourceTraceOrThrow({
          bus,
          busSourceTraces,
          traceNameOrPortSelector,
        })
        return getBusSrjConnectionNameOrThrow({
          srjConnections,
          bus,
          busSourceTraces,
          sourceTrace,
          traceNameOrPortSelector,
        })
      },
    )

    if (new Set(connectionNames).size !== connectionNames.length) {
      throw new Error(
        `Bus "${bus.name}" resolves multiple entries to one trace`,
      )
    }

    srjBuses.push({
      busId: bus.name,
      name: bus.name,
      connectionNames,
      ...(bus._parsedProps.fanoutTermination
        ? { termination: bus._parsedProps.fanoutTermination }
        : {}),
    })
  }

  return srjBuses.length > 0 ? srjBuses : undefined
}
