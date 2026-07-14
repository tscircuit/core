import type { SourceTrace } from "circuit-json"
import type { DifferentialPair } from "lib/components/primitive-components/DifferentialPair"
import type { Port } from "lib/components/primitive-components/Port/Port"
import type {
  SimpleRouteConnection,
  SimpleRouteDifferentialPair,
} from "./SimpleRouteJson"

type GetDifferentialPairsParams = {
  connections: SimpleRouteConnection[]
  differentialPairs: DifferentialPair[]
  sourceTraces: SourceTrace[]
  subcircuitId?: string | null
}

type GetSubcircuitConnectivityMapKeyParams = {
  differentialPair: DifferentialPair
  traceNameOrPortSelector: string
  sourceTraces: SourceTrace[]
}

type GetRequiredSrjConnectionNameParams = {
  connections: SimpleRouteConnection[]
  differentialPairName: string
  differentialPairSubcircuitId: string | null | undefined
  sourceTraces: SourceTrace[]
  subcircuitConnectivityMapKey: string
  traceNameOrPortSelector: string
}

const getSubcircuitConnectivityMapKey = ({
  differentialPair,
  traceNameOrPortSelector,
  sourceTraces,
}: GetSubcircuitConnectivityMapKeyParams): string => {
  const differentialPairSubcircuit = differentialPair.getSubcircuit()
  const differentialPairSubcircuitId = differentialPairSubcircuit.subcircuit_id
  const sourceTracesInSubcircuit: SourceTrace[] = []
  for (const sourceTrace of sourceTraces) {
    if (sourceTrace.subcircuit_id !== differentialPairSubcircuitId) continue
    sourceTracesInSubcircuit.push(sourceTrace)
  }

  const sourceTracesWithMatchingName = sourceTracesInSubcircuit.filter(
    (sourceTrace) => sourceTrace.name === traceNameOrPortSelector,
  )
  const selectedPort =
    sourceTracesWithMatchingName.length === 0
      ? differentialPairSubcircuit.selectOne<Port>(traceNameOrPortSelector, {
          type: "port",
        })
      : null
  const selectedSourcePortId = selectedPort?.source_port_id
  const matchingSourceTraces = selectedSourcePortId
    ? sourceTracesInSubcircuit.filter((sourceTrace) =>
        sourceTrace.connected_source_port_ids.includes(selectedSourcePortId),
      )
    : sourceTracesWithMatchingName

  if (matchingSourceTraces.length === 0) {
    throw new Error(
      `Could not find source trace for trace name or port selector "${traceNameOrPortSelector}" in differential pair "${differentialPair.name}"`,
    )
  }
  if (matchingSourceTraces.length > 1) {
    throw new Error(
      `Trace name or port selector "${traceNameOrPortSelector}" matches multiple source traces for differential pair "${differentialPair.name}"`,
    )
  }

  const sourceTrace: SourceTrace | undefined = matchingSourceTraces[0]
  if (!sourceTrace) {
    throw new Error(
      `Expected one source trace for trace name or port selector "${traceNameOrPortSelector}" in differential pair "${differentialPair.name}"`,
    )
  }

  const subcircuitConnectivityMapKey: string | undefined =
    sourceTrace.subcircuit_connectivity_map_key
  if (!subcircuitConnectivityMapKey) {
    throw new Error(
      `Source trace "${sourceTrace.source_trace_id}" does not have a subcircuit connectivity map key for differential pair "${differentialPair.name}"`,
    )
  }

  return subcircuitConnectivityMapKey
}

const getRequiredSrjConnectionName = ({
  connections,
  differentialPairName,
  differentialPairSubcircuitId,
  sourceTraces,
  subcircuitConnectivityMapKey,
  traceNameOrPortSelector,
}: GetRequiredSrjConnectionNameParams): string => {
  const sourceTraceIds: string[] = []
  for (const sourceTrace of sourceTraces) {
    if (sourceTrace.subcircuit_id !== differentialPairSubcircuitId) continue
    if (
      sourceTrace.subcircuit_connectivity_map_key ===
      subcircuitConnectivityMapKey
    ) {
      sourceTraceIds.push(sourceTrace.source_trace_id)
    }
  }

  const matchingSrjConnections: SimpleRouteConnection[] = []
  for (const connection of connections) {
    if (
      connection.source_trace_id &&
      sourceTraceIds.includes(connection.source_trace_id)
    ) {
      matchingSrjConnections.push(connection)
    }
  }

  if (matchingSrjConnections.length === 0) {
    throw new Error(
      `Could not find an SRJ connection for trace name or port selector "${traceNameOrPortSelector}" in differential pair "${differentialPairName}"`,
    )
  }
  if (matchingSrjConnections.length > 1) {
    throw new Error(
      `Subcircuit connectivity map key "${subcircuitConnectivityMapKey}" matches multiple SRJ connections for differential pair "${differentialPairName}"`,
    )
  }

  const srjConnection: SimpleRouteConnection | undefined =
    matchingSrjConnections[0]
  if (!srjConnection) {
    throw new Error(
      `Expected one SRJ connection for subcircuit connectivity map key "${subcircuitConnectivityMapKey}"`,
    )
  }

  return srjConnection.name
}

/** Converts differential-pair trace names or port selectors into SRJ constraints. */
export const getDifferentialPairsForSimpleRouteJson = ({
  connections,
  differentialPairs,
  sourceTraces,
  subcircuitId,
}: GetDifferentialPairsParams): SimpleRouteDifferentialPair[] | undefined => {
  const srjDifferentialPairs: SimpleRouteDifferentialPair[] = []
  for (const differentialPair of differentialPairs) {
    const differentialPairSubcircuitId: string | null | undefined =
      differentialPair.getSubcircuit().subcircuit_id
    if (subcircuitId && differentialPairSubcircuitId !== subcircuitId) {
      continue
    }

    const positiveTraceNameOrPortSelector: string =
      differentialPair._parsedProps.positiveConnection
    const negativeTraceNameOrPortSelector: string =
      differentialPair._parsedProps.negativeConnection
    const positiveSubcircuitConnectivityMapKey: string =
      getSubcircuitConnectivityMapKey({
        differentialPair,
        traceNameOrPortSelector: positiveTraceNameOrPortSelector,
        sourceTraces,
      })
    const negativeSubcircuitConnectivityMapKey: string =
      getSubcircuitConnectivityMapKey({
        differentialPair,
        traceNameOrPortSelector: negativeTraceNameOrPortSelector,
        sourceTraces,
      })

    const positiveSrjConnectionName: string = getRequiredSrjConnectionName({
      connections,
      differentialPairName: differentialPair.name,
      differentialPairSubcircuitId,
      sourceTraces,
      subcircuitConnectivityMapKey: positiveSubcircuitConnectivityMapKey,
      traceNameOrPortSelector: positiveTraceNameOrPortSelector,
    })
    const negativeSrjConnectionName: string = getRequiredSrjConnectionName({
      connections,
      differentialPairName: differentialPair.name,
      differentialPairSubcircuitId,
      sourceTraces,
      subcircuitConnectivityMapKey: negativeSubcircuitConnectivityMapKey,
      traceNameOrPortSelector: negativeTraceNameOrPortSelector,
    })

    // Note: SRJ names this value lengthTolerance, but it carries
    // maxLengthSkew unchanged.
    const lengthTolerance: number =
      differentialPair._parsedProps.maxLengthSkew ?? 0.1
    srjDifferentialPairs.push({
      connectionNames: [positiveSrjConnectionName, negativeSrjConnectionName],
      lengthTolerance,
    })
  }

  return srjDifferentialPairs.length > 0 ? srjDifferentialPairs : undefined
}
