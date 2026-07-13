import type { SourceTrace } from "circuit-json"
import type { DifferentialPair } from "lib/components/primitive-components/DifferentialPair"
import type { SimpleRouteConnection, SimpleRouteJson } from "./SimpleRouteJson"

type SrjDifferentialPair = NonNullable<
  SimpleRouteJson["differentialPairs"]
>[number]

type SourceTraceByName = Map<string, SourceTrace>
type SourceTracesBySubcircuitId = Map<
  string | null | undefined,
  SourceTraceByName
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
  pairName: string
  sourceTraceByName: SourceTraceByName
  traceName: string
}

const getRequiredConnectionName = ({
  connectionNameBySourceTraceId,
  pairName,
  sourceTraceByName,
  traceName,
}: GetRequiredConnectionNameParams): string => {
  const sourceTrace: SourceTrace | undefined = sourceTraceByName.get(traceName)
  if (!sourceTrace) {
    throw new Error(
      `Could not find source trace "${traceName}" for differential pair "${pairName}"`,
    )
  }

  const connectionName: string | undefined = connectionNameBySourceTraceId.get(
    sourceTrace.source_trace_id,
  )
  if (!connectionName) {
    throw new Error(
      `Could not find an SRJ connection for source trace "${traceName}" in differential pair "${pairName}"`,
    )
  }

  return connectionName
}

/** Converts differential-pair trace names into SRJ connection names. */
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

  const sourceTracesBySubcircuitId: SourceTracesBySubcircuitId = new Map()
  for (const sourceTrace of sourceTraces) {
    if (!sourceTrace.name) continue
    const sourceTraceByName: SourceTraceByName =
      sourceTracesBySubcircuitId.get(sourceTrace.subcircuit_id) ?? new Map()
    sourceTraceByName.set(sourceTrace.name, sourceTrace)
    sourceTracesBySubcircuitId.set(sourceTrace.subcircuit_id, sourceTraceByName)
  }

  const differentialPairs: SrjDifferentialPair[] = []
  for (const component of differentialPairComponents) {
    const componentSubcircuitId: string | null | undefined =
      component.getSubcircuit().subcircuit_id
    if (subcircuitId && componentSubcircuitId !== subcircuitId) continue

    const sourceTraceByName: SourceTraceByName | undefined =
      sourceTracesBySubcircuitId.get(componentSubcircuitId)
    if (!sourceTraceByName) {
      throw new Error(
        `Could not find source traces for differential pair "${component.name}"`,
      )
    }
    const positiveTraceName: string = component._parsedProps.positiveConnection
    const negativeTraceName: string = component._parsedProps.negativeConnection
    const lengthTolerance: number = component._parsedProps.maxLengthSkew ?? 0.1
    const differentialPair: SrjDifferentialPair = {
      connectionNames: [
        getRequiredConnectionName({
          connectionNameBySourceTraceId,
          pairName: component.name,
          sourceTraceByName,
          traceName: positiveTraceName,
        }),
        getRequiredConnectionName({
          connectionNameBySourceTraceId,
          pairName: component.name,
          sourceTraceByName,
          traceName: negativeTraceName,
        }),
      ],
      lengthTolerance,
    }
    differentialPairs.push(differentialPair)
  }

  return differentialPairs.length > 0 ? differentialPairs : undefined
}
