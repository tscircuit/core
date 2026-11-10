import { matchDifferentialPairSrjConnections } from "./matchDifferentialPairSrjConnections"
import { validateDifferentialPairNetMembers } from "./validateDifferentialPairNetMembers"
import type { SourceTrace } from "circuit-json"
import type { DifferentialPair } from "lib/components/primitive-components/DifferentialPair"
import type {
  PcbGroupId,
  SimpleRouteConnection,
  SimpleRouteDifferentialPair,
} from "./SimpleRouteJson"

import {
  type DifferentialPairMember,
  resolveDifferentialPairMemberOrThrow,
} from "./resolveDifferentialPairMember"

type SubcircuitId = NonNullable<SourceTrace["subcircuit_id"]>

type GetDifferentialPairsParams = {
  srjConnections: SimpleRouteConnection[]
  differentialPairs: DifferentialPair[]
  sourceTraces: SourceTrace[]
  subcircuitId?: SubcircuitId | null
}

/** Breakouts have one global connection and one connection per routing PCB group. */
type DifferentialPairSrjConnectionCohort = PcbGroupId | undefined

const getDifferentialPairSrjConnectionsByCohortOrThrow = ({
  srjConnections,
  differentialPair,
  sourceTraces,
  member,
  connectionSelector,
}: {
  srjConnections: SimpleRouteConnection[]
  differentialPair: DifferentialPair
  sourceTraces: SourceTrace[]
  member: DifferentialPairMember
  connectionSelector: string
}): Map<DifferentialPairSrjConnectionCohort, SimpleRouteConnection[]> => {
  const connectivityKey =
    member.kind === "net"
      ? member.sourceNet.subcircuit_connectivity_map_key
      : member.sourceTrace.subcircuit_connectivity_map_key
  if (!connectivityKey) {
    throw new Error(
      `Differential pair selector "${connectionSelector}" has no connectivity key in differential pair "${differentialPair.name}"`,
    )
  }
  const connectedTraces = sourceTraces.filter(
    (sourceTrace) =>
      sourceTrace.subcircuit_connectivity_map_key === connectivityKey,
  )
  const sourcePortIds = new Set(
    connectedTraces.flatMap((trace) => trace.connected_source_port_ids),
  )
  const sourceNetIds = new Set(
    connectedTraces.flatMap((trace) => trace.connected_source_net_ids),
  )
  let matchingSrjConnections: SimpleRouteConnection[]
  let selectorDescription: string
  if (member.kind === "net") {
    selectorDescription = `Net selector "${connectionSelector}"`
    if (sourcePortIds.size < 2) {
      throw new Error(
        `${selectorDescription} has fewer than two routable terminals in differential pair "${differentialPair.name}"`,
      )
    }
    const connectedTraceIds = new Set(
      connectedTraces.map((trace) => trace.source_trace_id),
    )
    matchingSrjConnections = srjConnections.filter(
      (connection) =>
        sourceNetIds.has(connection.name) ||
        (connection.source_trace_id !== undefined &&
          connectedTraceIds.has(connection.source_trace_id)) ||
        (connection.netConnectionName !== undefined &&
          sourceNetIds.has(connection.netConnectionName)) ||
        sourcePortIds.has(connection.name),
    )
  } else {
    selectorDescription = `Trace name or port selector "${connectionSelector}"`
    const sourceTraceId = member.sourceTrace.source_trace_id
    matchingSrjConnections = srjConnections.filter(
      (connection) => connection.source_trace_id === sourceTraceId,
    )
    // A fragmented two-terminal conductor may have only a net-level connection.
    // Never substitute another explicit path or a branched net for a named path.
    if (matchingSrjConnections.length === 0 && sourcePortIds.size === 2) {
      matchingSrjConnections = srjConnections.filter((connection) =>
        sourceNetIds.has(connection.name),
      )
    }
  }
  if (matchingSrjConnections.length === 0) {
    if (member.kind === "net") {
      throw new Error(
        `${selectorDescription} has no routable terminals in differential pair "${differentialPair.name}"`,
      )
    }
    throw new Error(
      `Could not find an SRJ connection for trace name or port selector "${connectionSelector}" in differential pair "${differentialPair.name}"`,
    )
  }
  const connectionsByCohort = new Map<
    DifferentialPairSrjConnectionCohort,
    SimpleRouteConnection[]
  >()
  for (const srjConnection of matchingSrjConnections) {
    const cohort = srjConnection.routingPcbGroupId
    const cohortConnections = connectionsByCohort.get(cohort) ?? []
    if (member.kind === "trace" && cohortConnections.length > 0) {
      const cohortLabel =
        cohort === undefined
          ? "the global routing cohort"
          : "one local routing region"
      throw new Error(
        `${selectorDescription} matches multiple SRJ connections in ${cohortLabel} for differential pair "${differentialPair.name}"`,
      )
    }
    cohortConnections.push(srjConnection)
    connectionsByCohort.set(cohort, cohortConnections)
  }
  return connectionsByCohort
}

const getDifferentialPairCohortLabel = (
  cohort: DifferentialPairSrjConnectionCohort,
): string =>
  cohort === undefined
    ? "the global routing cohort"
    : `routing PCB group "${cohort}"`

/** Converts trace names, port selectors and net selectors into SRJ constraints. */
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
    const positiveMember = resolveDifferentialPairMemberOrThrow(
      differentialPair,
      differentialPairSourceTraces,
      positiveTraceNameOrPortSelector,
    )
    const negativeMember = resolveDifferentialPairMemberOrThrow(
      differentialPair,
      differentialPairSourceTraces,
      negativeTraceNameOrPortSelector,
    )
    const positiveSrjConnectionsByCohort =
      getDifferentialPairSrjConnectionsByCohortOrThrow({
        srjConnections,
        differentialPair,
        sourceTraces: differentialPairSourceTraces,
        member: positiveMember,
        connectionSelector: positiveTraceNameOrPortSelector,
      })
    const negativeSrjConnectionsByCohort =
      getDifferentialPairSrjConnectionsByCohortOrThrow({
        srjConnections,
        differentialPair,
        sourceTraces: differentialPairSourceTraces,
        member: negativeMember,
        connectionSelector: negativeTraceNameOrPortSelector,
      })

    validateDifferentialPairNetMembers(
      differentialPair,
      positiveMember,
      negativeMember,
    )

    // Note: SRJ names this value lengthTolerance, but it carries
    // maxLengthSkew unchanged.
    const lengthTolerance: number =
      differentialPair._parsedProps.maxLengthSkew ?? 0.1
    for (const cohort of positiveSrjConnectionsByCohort.keys()) {
      if (negativeSrjConnectionsByCohort.has(cohort)) continue
      throw new Error(
        `Differential pair "${differentialPair.name}" has a positive SRJ connection in ${getDifferentialPairCohortLabel(cohort)} without a matching negative SRJ connection`,
      )
    }
    for (const cohort of negativeSrjConnectionsByCohort.keys()) {
      if (positiveSrjConnectionsByCohort.has(cohort)) continue
      throw new Error(
        `Differential pair "${differentialPair.name}" has a negative SRJ connection in ${getDifferentialPairCohortLabel(cohort)} without a matching positive SRJ connection`,
      )
    }
    for (const [
      cohort,
      positiveSrjConnections,
    ] of positiveSrjConnectionsByCohort) {
      const negativeSrjConnections = negativeSrjConnectionsByCohort.get(cohort)!
      const pairedConnectionNames = matchDifferentialPairSrjConnections(
        positiveSrjConnections,
        negativeSrjConnections,
        differentialPair.name,
      )
      for (const [
        positiveSrjConnectionName,
        negativeSrjConnectionName,
      ] of pairedConnectionNames) {
        if (positiveSrjConnectionName === negativeSrjConnectionName) {
          throw new Error(
            `Differential pair "${differentialPair.name}" positiveConnection="${positiveTraceNameOrPortSelector}" and negativeConnection="${negativeTraceNameOrPortSelector}" must resolve to different electrical nets`,
          )
        }
        srjDifferentialPairs.push({
          connectionNames: [
            positiveSrjConnectionName,
            negativeSrjConnectionName,
          ],
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
  }

  return srjDifferentialPairs.length > 0 ? srjDifferentialPairs : undefined
}
