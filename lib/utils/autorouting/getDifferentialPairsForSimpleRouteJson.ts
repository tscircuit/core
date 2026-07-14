import type { SourceTrace } from "circuit-json"
import type { DifferentialPair } from "lib/components/primitive-components/DifferentialPair"
import type { Port } from "lib/components/primitive-components/Port/Port"
import type {
  SimpleRouteConnection,
  SimpleRouteDifferentialPair,
  SrjConnectionName,
} from "./SimpleRouteJson"

type SourceTraceId = SourceTrace["source_trace_id"]
type SubcircuitId = NonNullable<SourceTrace["subcircuit_id"]>
type SubcircuitConnectivityMapKey = NonNullable<
  SourceTrace["subcircuit_connectivity_map_key"]
>

type GetDifferentialPairsParams = {
  srjConnections: SimpleRouteConnection[]
  differentialPairs: DifferentialPair[]
  sourceTraces: SourceTrace[]
  subcircuitId?: SubcircuitId | null
}

type GetDifferentialPairTraceSubcircuitConnectivityMapKeyOrThrowParams = {
  differentialPair: DifferentialPair
  differentialPairSourceTraces: SourceTrace[]
  traceNameOrPortSelector: string
}

type GetDifferentialPairSrjConnectionNameOrThrowParams = {
  srjConnections: SimpleRouteConnection[]
  differentialPairName: string
  differentialPairSourceTraces: SourceTrace[]
  traceSubcircuitConnectivityMapKey: SubcircuitConnectivityMapKey
  traceNameOrPortSelector: string
}

const getDifferentialPairTraceSubcircuitConnectivityMapKeyOrThrow = ({
  differentialPair,
  differentialPairSourceTraces,
  traceNameOrPortSelector,
}: GetDifferentialPairTraceSubcircuitConnectivityMapKeyOrThrowParams): SubcircuitConnectivityMapKey => {
  const differentialPairSubcircuit = differentialPair.getSubcircuit()
  const sourceTracesWithMatchingName = differentialPairSourceTraces.filter(
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
    ? differentialPairSourceTraces.filter((sourceTrace) =>
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

  const sourceTrace = matchingSourceTraces[0]
  if (!sourceTrace) {
    throw new Error(
      `Expected one source trace for trace name or port selector "${traceNameOrPortSelector}" in differential pair "${differentialPair.name}"`,
    )
  }

  const subcircuitConnectivityMapKey =
    sourceTrace.subcircuit_connectivity_map_key
  if (!subcircuitConnectivityMapKey) {
    throw new Error(
      `Source trace "${sourceTrace.source_trace_id}" does not have a subcircuit connectivity map key for differential pair "${differentialPair.name}"`,
    )
  }

  return subcircuitConnectivityMapKey
}

const getDifferentialPairSrjConnectionNameOrThrow = ({
  srjConnections,
  differentialPairName,
  differentialPairSourceTraces,
  traceSubcircuitConnectivityMapKey,
  traceNameOrPortSelector,
}: GetDifferentialPairSrjConnectionNameOrThrowParams): SrjConnectionName => {
  const differentialPairSourceTraceIds: SourceTraceId[] = []
  for (const sourceTrace of differentialPairSourceTraces) {
    if (
      sourceTrace.subcircuit_connectivity_map_key ===
      traceSubcircuitConnectivityMapKey
    ) {
      differentialPairSourceTraceIds.push(sourceTrace.source_trace_id)
    }
  }

  const matchingSrjConnections: SimpleRouteConnection[] = []
  for (const srjConnection of srjConnections) {
    if (
      srjConnection.source_trace_id &&
      differentialPairSourceTraceIds.includes(srjConnection.source_trace_id)
    ) {
      matchingSrjConnections.push(srjConnection)
    }
  }

  if (matchingSrjConnections.length === 0) {
    throw new Error(
      `Could not find an SRJ connection for trace name or port selector "${traceNameOrPortSelector}" in differential pair "${differentialPairName}"`,
    )
  }
  if (matchingSrjConnections.length > 1) {
    throw new Error(
      `Subcircuit connectivity map key "${traceSubcircuitConnectivityMapKey}" matches multiple SRJ connections for differential pair "${differentialPairName}"`,
    )
  }

  const srjConnection = matchingSrjConnections[0]
  if (!srjConnection) {
    throw new Error(
      `Expected one SRJ connection for subcircuit connectivity map key "${traceSubcircuitConnectivityMapKey}"`,
    )
  }

  return srjConnection.name
}

/** Converts differential-pair trace names or port selectors into SRJ constraints. */
export const getDifferentialPairsForSimpleRouteJson = ({
  srjConnections,
  differentialPairs,
  sourceTraces,
  subcircuitId,
}: GetDifferentialPairsParams): SimpleRouteDifferentialPair[] | undefined => {
  const srjDifferentialPairs: SimpleRouteDifferentialPair[] = []
  for (const differentialPair of differentialPairs) {
    const differentialPairSubcircuitId =
      differentialPair.getSubcircuit().subcircuit_id
    if (subcircuitId && differentialPairSubcircuitId !== subcircuitId) {
      continue
    }

    const differentialPairSourceTraces = sourceTraces.filter(
      (sourceTrace) =>
        sourceTrace.subcircuit_id === differentialPairSubcircuitId,
    )
    const positiveTraceNameOrPortSelector =
      differentialPair._parsedProps.positiveConnection
    const negativeTraceNameOrPortSelector =
      differentialPair._parsedProps.negativeConnection
    const positiveSubcircuitConnectivityMapKey =
      getDifferentialPairTraceSubcircuitConnectivityMapKeyOrThrow({
        differentialPair,
        differentialPairSourceTraces,
        traceNameOrPortSelector: positiveTraceNameOrPortSelector,
      })
    const negativeSubcircuitConnectivityMapKey =
      getDifferentialPairTraceSubcircuitConnectivityMapKeyOrThrow({
        differentialPair,
        differentialPairSourceTraces,
        traceNameOrPortSelector: negativeTraceNameOrPortSelector,
      })

    const positiveSrjConnectionName =
      getDifferentialPairSrjConnectionNameOrThrow({
        srjConnections,
        differentialPairName: differentialPair.name,
        differentialPairSourceTraces,
        traceSubcircuitConnectivityMapKey: positiveSubcircuitConnectivityMapKey,
        traceNameOrPortSelector: positiveTraceNameOrPortSelector,
      })
    const negativeSrjConnectionName =
      getDifferentialPairSrjConnectionNameOrThrow({
        srjConnections,
        differentialPairName: differentialPair.name,
        differentialPairSourceTraces,
        traceSubcircuitConnectivityMapKey: negativeSubcircuitConnectivityMapKey,
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
