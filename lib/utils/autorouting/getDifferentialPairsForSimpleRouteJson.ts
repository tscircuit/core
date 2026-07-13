import type { SourceTrace } from "circuit-json"
import type { DifferentialPair } from "lib/components/primitive-components/DifferentialPair"
import type { SimpleRouteConnection, SimpleRouteJson } from "./SimpleRouteJson"

type SrjDifferentialPair = NonNullable<
  SimpleRouteJson["differentialPairs"]
>[number]

type SourceTraceIndex = {
  byName: Map<string, SourceTrace>
  bySourcePortId: Map<string, SourceTrace[]>
}

type SourceTraceIndexesBySubcircuitId = Map<
  string | null | undefined,
  SourceTraceIndex
>
type ConnectionNameBySourceTraceId = Map<string, string>

type GetDifferentialPairsParams = {
  connections: SimpleRouteConnection[]
  differentialPairComponents: DifferentialPair[]
  sourceTraces: SourceTrace[]
  subcircuitId?: string | null
}

type GetRequiredConnectionNameParams = {
  connectionNameBySourceTraceId: ConnectionNameBySourceTraceId
  connectionReference: string
  pairName: string
  sourceTraceIndex: SourceTraceIndex
}

const getRequiredConnectionName = ({
  connectionNameBySourceTraceId,
  connectionReference,
  pairName,
  sourceTraceIndex,
}: GetRequiredConnectionNameParams): string => {
  const sourceTraceByName: SourceTrace | undefined =
    sourceTraceIndex.byName.get(connectionReference)
  const sourceTracesByPinId: SourceTrace[] =
    sourceTraceIndex.bySourcePortId.get(connectionReference) ?? []
  if (!sourceTraceByName && sourceTracesByPinId.length > 1) {
    throw new Error(
      `Pin "${connectionReference}" belongs to multiple source traces for differential pair "${pairName}"`,
    )
  }
  const sourceTrace: SourceTrace | undefined =
    sourceTraceByName ?? sourceTracesByPinId[0]
  if (!sourceTrace) {
    throw new Error(
      `Could not find source trace or pin "${connectionReference}" for differential pair "${pairName}"`,
    )
  }

  const connectionName: string | undefined = connectionNameBySourceTraceId.get(
    sourceTrace.source_trace_id,
  )
  if (!connectionName) {
    throw new Error(
      `Could not find an SRJ connection for "${connectionReference}" in differential pair "${pairName}"`,
    )
  }

  return connectionName
}

/** Converts trace-name or source-port-ID references into SRJ connection names. */
export const getDifferentialPairsForSimpleRouteJson = ({
  connections,
  differentialPairComponents,
  sourceTraces,
  subcircuitId,
}: GetDifferentialPairsParams): SrjDifferentialPair[] | undefined => {
  const connectionNameBySourceTraceId: ConnectionNameBySourceTraceId = new Map()
  for (const connection of connections) {
    if (!connection.source_trace_id) continue
    connectionNameBySourceTraceId.set(
      connection.source_trace_id,
      connection.name,
    )
  }

  const sourceTraceIndexesBySubcircuitId: SourceTraceIndexesBySubcircuitId =
    new Map()
  for (const sourceTrace of sourceTraces) {
    const sourceTraceIndex: SourceTraceIndex =
      sourceTraceIndexesBySubcircuitId.get(sourceTrace.subcircuit_id) ?? {
        byName: new Map(),
        bySourcePortId: new Map(),
      }
    if (sourceTrace.name) {
      sourceTraceIndex.byName.set(sourceTrace.name, sourceTrace)
    }
    for (const sourcePortId of sourceTrace.connected_source_port_ids) {
      const sourceTracesForPort: SourceTrace[] =
        sourceTraceIndex.bySourcePortId.get(sourcePortId) ?? []
      sourceTracesForPort.push(sourceTrace)
      sourceTraceIndex.bySourcePortId.set(sourcePortId, sourceTracesForPort)
    }
    sourceTraceIndexesBySubcircuitId.set(
      sourceTrace.subcircuit_id,
      sourceTraceIndex,
    )
  }

  const differentialPairs: SrjDifferentialPair[] = []
  for (const component of differentialPairComponents) {
    const componentSubcircuitId: string | null | undefined =
      component.getSubcircuit().subcircuit_id
    if (subcircuitId && componentSubcircuitId !== subcircuitId) continue

    const sourceTraceIndex: SourceTraceIndex | undefined =
      sourceTraceIndexesBySubcircuitId.get(componentSubcircuitId)
    if (!sourceTraceIndex) {
      throw new Error(
        `Could not find source traces for differential pair "${component.name}"`,
      )
    }
    const positiveConnectionReference: string =
      component._parsedProps.positiveConnection
    const negativeConnectionReference: string =
      component._parsedProps.negativeConnection
    const lengthTolerance: number = component._parsedProps.maxLengthSkew ?? 0.1
    const differentialPair: SrjDifferentialPair = {
      connectionNames: [
        getRequiredConnectionName({
          connectionNameBySourceTraceId,
          connectionReference: positiveConnectionReference,
          pairName: component.name,
          sourceTraceIndex,
        }),
        getRequiredConnectionName({
          connectionNameBySourceTraceId,
          connectionReference: negativeConnectionReference,
          pairName: component.name,
          sourceTraceIndex,
        }),
      ],
      lengthTolerance,
    }
    differentialPairs.push(differentialPair)
  }

  return differentialPairs.length > 0 ? differentialPairs : undefined
}
