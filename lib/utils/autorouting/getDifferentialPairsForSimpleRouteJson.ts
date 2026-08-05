import type { SourceNet, SourcePort, SourceTrace } from "circuit-json"
import type { DifferentialPair } from "lib/components/primitive-components/DifferentialPair"
import type {
  SimpleRouteConnection,
  SimpleRouteDifferentialPair,
  SrjConnectionName,
} from "./SimpleRouteJson"
import {
  type SourceNetId,
  type SubcircuitConnectivityMapKey,
  type SubcircuitId,
  resolveDifferentialPairConnectionOrThrow,
} from "./resolve-differential-pair-connection"

type SourceTraceId = SourceTrace["source_trace_id"]

type GetDifferentialPairsParams = {
  srjConnections: SimpleRouteConnection[]
  differentialPairs: DifferentialPair[]
  sourceTraces: SourceTrace[]
  sourcePorts: SourcePort[]
  sourceNets: SourceNet[]
  subcircuitId?: SubcircuitId | null
}

type GetDifferentialPairSrjConnectionNameOrThrowParams = {
  srjConnections: SimpleRouteConnection[]
  differentialPairName: string
  differentialPairSourceTraces: SourceTrace[]
  traceSubcircuitConnectivityMapKey: SubcircuitConnectivityMapKey
  traceNameOrPortSelector: string
}

const getDifferentialPairSrjConnectionNameOrThrow = ({
  srjConnections,
  differentialPairName,
  differentialPairSourceTraces,
  traceSubcircuitConnectivityMapKey,
  traceNameOrPortSelector,
}: GetDifferentialPairSrjConnectionNameOrThrowParams): SrjConnectionName => {
  const differentialPairSourceTraceIds: SourceTraceId[] = []
  const differentialPairSourceNetIds = new Set<SourceNetId>()
  for (const sourceTrace of differentialPairSourceTraces) {
    if (
      sourceTrace.subcircuit_connectivity_map_key ===
      traceSubcircuitConnectivityMapKey
    ) {
      differentialPairSourceTraceIds.push(sourceTrace.source_trace_id)
      for (const sourceNetId of sourceTrace.connected_source_net_ids) {
        differentialPairSourceNetIds.add(sourceNetId)
      }
    }
  }

  const matchingTraceSrjConnections: SimpleRouteConnection[] = []
  for (const srjConnection of srjConnections) {
    if (
      (srjConnection.source_trace_id &&
        differentialPairSourceTraceIds.includes(
          srjConnection.source_trace_id,
        )) ||
      srjConnection.mergedConnectionNames?.some((sourceTraceId) =>
        differentialPairSourceTraceIds.includes(sourceTraceId),
      )
    ) {
      matchingTraceSrjConnections.push(srjConnection)
    }
  }
  const matchingSrjConnections =
    matchingTraceSrjConnections.length > 0
      ? matchingTraceSrjConnections
      : srjConnections.filter((srjConnection) =>
          differentialPairSourceNetIds.has(srjConnection.name),
        )

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
  sourcePorts,
  sourceNets,
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
    const positiveConnection = resolveDifferentialPairConnectionOrThrow({
      differentialPair,
      traceNameOrPortSelector: positiveTraceNameOrPortSelector,
      sourceTraces,
      sourcePorts,
      sourceNets,
    })
    const negativeConnection = resolveDifferentialPairConnectionOrThrow({
      differentialPair,
      traceNameOrPortSelector: negativeTraceNameOrPortSelector,
      sourceTraces,
      sourcePorts,
      sourceNets,
    })

    if (
      positiveConnection.sourcePorts.length !== 2 ||
      negativeConnection.sourcePorts.length !== 2
    ) {
      continue
    }

    const positiveSrjConnectionName =
      getDifferentialPairSrjConnectionNameOrThrow({
        srjConnections,
        differentialPairName: differentialPair.name,
        differentialPairSourceTraces,
        traceSubcircuitConnectivityMapKey:
          positiveConnection.subcircuitConnectivityMapKey,
        traceNameOrPortSelector: positiveTraceNameOrPortSelector,
      })
    const negativeSrjConnectionName =
      getDifferentialPairSrjConnectionNameOrThrow({
        srjConnections,
        differentialPairName: differentialPair.name,
        differentialPairSourceTraces,
        traceSubcircuitConnectivityMapKey:
          negativeConnection.subcircuitConnectivityMapKey,
        traceNameOrPortSelector: negativeTraceNameOrPortSelector,
      })

    // Note: SRJ names this value lengthTolerance, but it carries
    // maxLengthSkew unchanged.
    const lengthTolerance: number =
      differentialPair._parsedProps.maxLengthSkew ?? 0.1
    srjDifferentialPairs.push({
      connectionNames: [positiveSrjConnectionName, negativeSrjConnectionName],
      lengthTolerance,
      ...(differentialPair._parsedProps.pcbTraceGap !== undefined
        ? { traceGap: differentialPair._parsedProps.pcbTraceGap }
        : {}),
      ...(differentialPair._parsedProps.maxUncoupledLength !== undefined
        ? {
            maxUncoupledLength:
              differentialPair._parsedProps.maxUncoupledLength,
          }
        : {}),
    })
  }

  return srjDifferentialPairs.length > 0 ? srjDifferentialPairs : undefined
}
