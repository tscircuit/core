import type { SourcePort, SourceTrace } from "circuit-json"
import type { DifferentialPair } from "lib/components/primitive-components/DifferentialPair"
import type { Port } from "lib/components/primitive-components/Port/Port"
import type {
  PcbGroupId,
  SimpleRouteConnection,
  SimpleRouteDifferentialPair,
  SrjConnectionName,
} from "./SimpleRouteJson"

type SourceTraceId = SourceTrace["source_trace_id"]
type SourceNetId = NonNullable<SourceTrace["connected_source_net_ids"]>[number]
type SourcePortId = NonNullable<SourcePort["source_port_id"]>
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

type GetDifferentialPairSourceTraceOrThrowParams = {
  differentialPair: DifferentialPair
  differentialPairSourceTraces: SourceTrace[]
  traceNameOrPortSelector: string
}

type DifferentialPairSourceTraceSelection = {
  sourceTraceId: SourceTraceId
  subcircuitConnectivityMapKey: SubcircuitConnectivityMapKey
}

type GetDifferentialPairSrjConnectionNamesByCohortOrThrowParams = {
  srjConnections: SimpleRouteConnection[]
  differentialPairName: string
  differentialPairSourceTraces: SourceTrace[]
  sourceTraceId: SourceTraceId
  traceSubcircuitConnectivityMapKey: SubcircuitConnectivityMapKey
  traceNameOrPortSelector: string
}

/**
 * Automatic breakouts split one source trace into a global SRJ connection and
 * one local connection per routing PCB group. `undefined` identifies the
 * global cohort.
 */
type DifferentialPairSrjConnectionCohort = PcbGroupId | undefined

const getDifferentialPairSourceTracesByTraceName = (
  differentialPairSourceTraces: SourceTrace[],
  traceName: string,
): SourceTrace[] =>
  differentialPairSourceTraces.filter(
    (sourceTrace) => sourceTrace.name === traceName,
  )

const getDifferentialPairSourceTracesByPortId = (
  differentialPairSourceTraces: SourceTrace[],
  sourcePortId: SourcePortId,
): SourceTrace[] =>
  differentialPairSourceTraces.filter((sourceTrace) =>
    sourceTrace.connected_source_port_ids.includes(sourcePortId),
  )

const getDifferentialPairSourceTraceOrThrow = ({
  differentialPair,
  differentialPairSourceTraces,
  traceNameOrPortSelector,
}: GetDifferentialPairSourceTraceOrThrowParams): DifferentialPairSourceTraceSelection => {
  const differentialPairSubcircuit = differentialPair.getSubcircuit()
  const sourceTracesWithMatchingName =
    getDifferentialPairSourceTracesByTraceName(
      differentialPairSourceTraces,
      traceNameOrPortSelector,
    )
  const selectedPort =
    sourceTracesWithMatchingName.length === 0
      ? differentialPairSubcircuit.selectOne<Port>(traceNameOrPortSelector, {
          type: "port",
        })
      : null
  const selectedSourcePortId: SourcePortId | undefined =
    selectedPort?.source_port_id ?? undefined
  const matchingSourceTraces = selectedSourcePortId
    ? getDifferentialPairSourceTracesByPortId(
        differentialPairSourceTraces,
        selectedSourcePortId,
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
      `Source trace "${traceNameOrPortSelector}" does not have a subcircuit connectivity map key for differential pair "${differentialPair.name}"`,
    )
  }

  return {
    sourceTraceId: sourceTrace.source_trace_id,
    subcircuitConnectivityMapKey,
  }
}

const getDifferentialPairSrjConnectionNamesByCohortOrThrow = ({
  srjConnections,
  differentialPairName,
  differentialPairSourceTraces,
  sourceTraceId,
  traceSubcircuitConnectivityMapKey,
  traceNameOrPortSelector,
}: GetDifferentialPairSrjConnectionNamesByCohortOrThrowParams): Map<
  DifferentialPairSrjConnectionCohort,
  SrjConnectionName
> => {
  const differentialPairSourceTraceIds: SourceTraceId[] = []
  const differentialPairSourceNetIds = new Set<SourceNetId>()
  for (const sourceTrace of differentialPairSourceTraces) {
    if (
      sourceTrace.subcircuit_connectivity_map_key ===
      traceSubcircuitConnectivityMapKey
    ) {
      differentialPairSourceTraceIds.push(sourceTrace.source_trace_id)
      for (const sourceNetId of sourceTrace.connected_source_net_ids ?? []) {
        differentialPairSourceNetIds.add(sourceNetId)
      }
    }
  }

  // A named trunk and its termination tap share an electrical net. Resolve the
  // selected trace's own global/local connections before using net-level SRJ
  // connections, as bus conversion does for distinct branches on one net.
  const directSrjConnections = srjConnections.filter(
    (connection) => connection.source_trace_id === sourceTraceId,
  )
  const matchingSrjConnections =
    directSrjConnections.length > 0
      ? directSrjConnections
      : srjConnections.filter(
          (connection) =>
            differentialPairSourceNetIds.has(connection.name) ||
            (connection.source_trace_id &&
              differentialPairSourceTraceIds.includes(
                connection.source_trace_id,
              )),
        )

  if (matchingSrjConnections.length === 0) {
    throw new Error(
      `Could not find an SRJ connection for trace name or port selector "${traceNameOrPortSelector}" in differential pair "${differentialPairName}"`,
    )
  }

  const connectionNamesByCohort = new Map<
    DifferentialPairSrjConnectionCohort,
    SrjConnectionName
  >()
  for (const srjConnection of matchingSrjConnections) {
    const cohort = srjConnection.routingPcbGroupId
    if (connectionNamesByCohort.has(cohort)) {
      const cohortLabel =
        cohort === undefined
          ? "the global routing cohort"
          : "one local routing region"
      throw new Error(
        `Trace name or port selector "${traceNameOrPortSelector}" matches multiple SRJ connections in ${cohortLabel} for differential pair "${differentialPairName}"`,
      )
    }
    connectionNamesByCohort.set(cohort, srjConnection.name)
  }

  return connectionNamesByCohort
}

const getDifferentialPairCohortLabel = (
  cohort: DifferentialPairSrjConnectionCohort,
): string =>
  cohort === undefined
    ? "the global routing cohort"
    : `routing PCB group "${cohort}"`

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
    const positiveSourceTrace = getDifferentialPairSourceTraceOrThrow({
      differentialPair,
      differentialPairSourceTraces,
      traceNameOrPortSelector: positiveTraceNameOrPortSelector,
    })
    const negativeSourceTrace = getDifferentialPairSourceTraceOrThrow({
      differentialPair,
      differentialPairSourceTraces,
      traceNameOrPortSelector: negativeTraceNameOrPortSelector,
    })

    const positiveSrjConnectionNamesByCohort =
      getDifferentialPairSrjConnectionNamesByCohortOrThrow({
        srjConnections,
        differentialPairName: differentialPair.name,
        differentialPairSourceTraces,
        sourceTraceId: positiveSourceTrace.sourceTraceId,
        traceSubcircuitConnectivityMapKey:
          positiveSourceTrace.subcircuitConnectivityMapKey,
        traceNameOrPortSelector: positiveTraceNameOrPortSelector,
      })
    const negativeSrjConnectionNamesByCohort =
      getDifferentialPairSrjConnectionNamesByCohortOrThrow({
        srjConnections,
        differentialPairName: differentialPair.name,
        differentialPairSourceTraces,
        sourceTraceId: negativeSourceTrace.sourceTraceId,
        traceSubcircuitConnectivityMapKey:
          negativeSourceTrace.subcircuitConnectivityMapKey,
        traceNameOrPortSelector: negativeTraceNameOrPortSelector,
      })

    // Note: SRJ names this value lengthTolerance, but it carries
    // maxLengthSkew unchanged.
    const lengthTolerance: number =
      differentialPair._parsedProps.maxLengthSkew ?? 0.1
    for (const cohort of positiveSrjConnectionNamesByCohort.keys()) {
      if (negativeSrjConnectionNamesByCohort.has(cohort)) continue
      throw new Error(
        `Differential pair "${differentialPair.name}" has a positive SRJ connection in ${getDifferentialPairCohortLabel(cohort)} without a matching negative SRJ connection`,
      )
    }
    for (const cohort of negativeSrjConnectionNamesByCohort.keys()) {
      if (positiveSrjConnectionNamesByCohort.has(cohort)) continue
      throw new Error(
        `Differential pair "${differentialPair.name}" has a negative SRJ connection in ${getDifferentialPairCohortLabel(cohort)} without a matching positive SRJ connection`,
      )
    }
    for (const [
      cohort,
      positiveSrjConnectionName,
    ] of positiveSrjConnectionNamesByCohort) {
      const negativeSrjConnectionName =
        negativeSrjConnectionNamesByCohort.get(cohort)!
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
  }

  return srjDifferentialPairs.length > 0 ? srjDifferentialPairs : undefined
}
