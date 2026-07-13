import type { SourceTrace } from "circuit-json"
import type { DifferentialPair } from "lib/components/primitive-components/DifferentialPair"
import type { SimpleRouteConnection, SimpleRouteJson } from "./SimpleRouteJson"

type SrjDifferentialPair = NonNullable<
  SimpleRouteJson["differentialPairs"]
>[number]

type SourceTraceIndex = Map<string, Set<SourceTrace>>

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
  const matchingSourceTraces: Set<SourceTrace> | undefined =
    sourceTraceIndex.get(connectionReference)
  if (!matchingSourceTraces) {
    throw new Error(
      `Could not find source trace or pin "${connectionReference}" for differential pair "${pairName}"`,
    )
  }
  if (matchingSourceTraces.size > 1) {
    throw new Error(
      `Connection reference "${connectionReference}" matches multiple source traces for differential pair "${pairName}"`,
    )
  }

  const sourceTrace: SourceTrace | undefined = matchingSourceTraces
    .values()
    .next().value
  if (!sourceTrace) {
    throw new Error(
      `Source trace index is empty for connection reference "${connectionReference}" in differential pair "${pairName}"`,
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
      sourceTraceIndexesBySubcircuitId.get(sourceTrace.subcircuit_id) ??
      new Map()
    const connectionReferences: string[] = [
      ...sourceTrace.connected_source_port_ids,
    ]
    if (sourceTrace.name) connectionReferences.push(sourceTrace.name)

    for (const connectionReference of connectionReferences) {
      const matchingSourceTraces: Set<SourceTrace> =
        sourceTraceIndex.get(connectionReference) ?? new Set()
      matchingSourceTraces.add(sourceTrace)
      sourceTraceIndex.set(connectionReference, matchingSourceTraces)
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
    // Note: SRJ names this value lengthTolerance, but it carries
    // maxLengthSkew unchanged.
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
