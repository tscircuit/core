import type { SourceTrace } from "circuit-json"
import type { DifferentialPair } from "lib/components/primitive-components/DifferentialPair"
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
  differentialPairName: string
  differentialPairSubcircuitId: string | null | undefined
  sourceTraces: SourceTrace[]
  traceNameOrSourcePortId: string
}

type GetRequiredSrjConnectionNameParams = {
  connections: SimpleRouteConnection[]
  differentialPairName: string
  differentialPairSubcircuitId: string | null | undefined
  sourceTraces: SourceTrace[]
  subcircuitConnectivityMapKey: string
  traceNameOrSourcePortId: string
}

const getSubcircuitConnectivityMapKey = ({
  differentialPairName,
  differentialPairSubcircuitId,
  sourceTraces,
  traceNameOrSourcePortId,
}: GetSubcircuitConnectivityMapKeyParams): string => {
  const matchingSourceTraces: SourceTrace[] = []
  for (const sourceTrace of sourceTraces) {
    if (sourceTrace.subcircuit_id !== differentialPairSubcircuitId) continue

    const matchesTraceName: boolean =
      sourceTrace.name === traceNameOrSourcePortId
    const matchesSourcePortId: boolean =
      sourceTrace.connected_source_port_ids.includes(traceNameOrSourcePortId)
    if (matchesTraceName || matchesSourcePortId) {
      matchingSourceTraces.push(sourceTrace)
    }
  }

  if (matchingSourceTraces.length === 0) {
    throw new Error(
      `Could not find source trace or pin "${traceNameOrSourcePortId}" for differential pair "${differentialPairName}"`,
    )
  }
  if (matchingSourceTraces.length > 1) {
    throw new Error(
      `Trace name or source port ID "${traceNameOrSourcePortId}" matches multiple source traces for differential pair "${differentialPairName}"`,
    )
  }

  const sourceTrace: SourceTrace | undefined = matchingSourceTraces[0]
  if (!sourceTrace) {
    throw new Error(
      `Expected one source trace for "${traceNameOrSourcePortId}" in differential pair "${differentialPairName}"`,
    )
  }

  const subcircuitConnectivityMapKey: string | undefined =
    sourceTrace.subcircuit_connectivity_map_key
  if (!subcircuitConnectivityMapKey) {
    throw new Error(
      `Source trace "${sourceTrace.source_trace_id}" does not have a subcircuit connectivity map key for differential pair "${differentialPairName}"`,
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
  traceNameOrSourcePortId,
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
      `Could not find an SRJ connection for "${traceNameOrSourcePortId}" in differential pair "${differentialPairName}"`,
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

/** Converts differential-pair trace or pin references into SRJ constraints. */
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

    const positiveTraceNameOrSourcePortId: string =
      differentialPair._parsedProps.positiveConnection
    const negativeTraceNameOrSourcePortId: string =
      differentialPair._parsedProps.negativeConnection
    const positiveSubcircuitConnectivityMapKey: string =
      getSubcircuitConnectivityMapKey({
        differentialPairName: differentialPair.name,
        differentialPairSubcircuitId,
        sourceTraces,
        traceNameOrSourcePortId: positiveTraceNameOrSourcePortId,
      })
    const negativeSubcircuitConnectivityMapKey: string =
      getSubcircuitConnectivityMapKey({
        differentialPairName: differentialPair.name,
        differentialPairSubcircuitId,
        sourceTraces,
        traceNameOrSourcePortId: negativeTraceNameOrSourcePortId,
      })

    const positiveSrjConnectionName: string = getRequiredSrjConnectionName({
      connections,
      differentialPairName: differentialPair.name,
      differentialPairSubcircuitId,
      sourceTraces,
      subcircuitConnectivityMapKey: positiveSubcircuitConnectivityMapKey,
      traceNameOrSourcePortId: positiveTraceNameOrSourcePortId,
    })
    const negativeSrjConnectionName: string = getRequiredSrjConnectionName({
      connections,
      differentialPairName: differentialPair.name,
      differentialPairSubcircuitId,
      sourceTraces,
      subcircuitConnectivityMapKey: negativeSubcircuitConnectivityMapKey,
      traceNameOrSourcePortId: negativeTraceNameOrSourcePortId,
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
