import type { SourceTrace } from "circuit-json"
import { AutorouterError } from "lib/errors/AutorouterError"
import type {
  SimpleRouteConnection,
  SimpleRouteJson,
  SimplifiedPcbTrace,
  SrjConnectionName,
} from "lib/utils/autorouting/SimpleRouteJson"
import { getSourceTraceIdsFromRerouteName } from "./region-replacement"

type SourceTraceId = SourceTrace["source_trace_id"]

const WIDTH_COMPARISON_TOLERANCE_MM = 1e-6

const getSourceTraceIdsForSrjConnection = ({
  srjConnection,
  sourceTraceMinimumWidthById,
}: {
  srjConnection: SimpleRouteConnection
  sourceTraceMinimumWidthById: ReadonlyMap<SourceTraceId, number>
}): Set<SourceTraceId> => {
  const sourceTraceIds = new Set<SourceTraceId>()
  const possibleSourceTraceIds = [
    srjConnection.name,
    srjConnection.source_trace_id,
    srjConnection.rootConnectionName,
    ...(srjConnection.mergedConnectionNames ?? []),
  ]

  for (const possibleSourceTraceId of possibleSourceTraceIds) {
    if (!possibleSourceTraceId) continue
    const sourceTraceMinimumWidth = sourceTraceMinimumWidthById.get(
      possibleSourceTraceId,
    )
    if (sourceTraceMinimumWidth === undefined) continue
    if (
      srjConnection.nominalTraceWidth === undefined ||
      srjConnection.nominalTraceWidth + WIDTH_COMPARISON_TOLERANCE_MM <
        sourceTraceMinimumWidth
    ) {
      continue
    }
    sourceTraceIds.add(possibleSourceTraceId)
  }

  return sourceTraceIds
}

const getSourceTraceIdsBySrjConnectionAlias = ({
  srjConnections,
  sourceTraceMinimumWidthById,
}: {
  srjConnections: SimpleRouteConnection[]
  sourceTraceMinimumWidthById: ReadonlyMap<SourceTraceId, number>
}): Map<SrjConnectionName, Set<SourceTraceId>> => {
  const sourceTraceIdsBySrjConnectionAlias = new Map<
    SrjConnectionName,
    Set<SourceTraceId>
  >()

  for (const srjConnection of srjConnections) {
    const sourceTraceIds = getSourceTraceIdsForSrjConnection({
      srjConnection,
      sourceTraceMinimumWidthById,
    })
    if (sourceTraceIds.size === 0) continue

    const srjConnectionAliases = [
      srjConnection.name,
      srjConnection.source_trace_id,
      srjConnection.rootConnectionName,
      ...(srjConnection.mergedConnectionNames ?? []),
    ]
    for (const srjConnectionAlias of srjConnectionAliases) {
      if (!srjConnectionAlias) continue
      const aliasedSourceTraceIds =
        sourceTraceIdsBySrjConnectionAlias.get(srjConnectionAlias) ??
        new Set<SourceTraceId>()
      for (const sourceTraceId of sourceTraceIds) {
        aliasedSourceTraceIds.add(sourceTraceId)
      }
      sourceTraceIdsBySrjConnectionAlias.set(
        srjConnectionAlias,
        aliasedSourceTraceIds,
      )
    }
  }

  return sourceTraceIdsBySrjConnectionAlias
}

const getOutputTraceSourceTraceIds = ({
  outputPcbTrace,
  sourceTraceIdsBySrjConnectionAlias,
}: {
  outputPcbTrace: SimplifiedPcbTrace
  sourceTraceIdsBySrjConnectionAlias: ReadonlyMap<
    SrjConnectionName,
    ReadonlySet<SourceTraceId>
  >
}): Set<SourceTraceId> => {
  const sourceTraceIds = new Set<SourceTraceId>()
  const possibleSrjConnectionAliases = [
    outputPcbTrace.connection_name,
    outputPcbTrace.pcb_trace_id,
    ...(outputPcbTrace.connectsTo ?? []),
  ].flatMap(getSourceTraceIdsFromRerouteName)

  for (const possibleSrjConnectionAlias of possibleSrjConnectionAliases) {
    for (const sourceTraceId of sourceTraceIdsBySrjConnectionAlias.get(
      possibleSrjConnectionAlias,
    ) ?? []) {
      sourceTraceIds.add(sourceTraceId)
    }
  }

  return sourceTraceIds
}

/**
 * Rejects autorouter output that never reaches an explicit source trace
 * minimum supplied to the solver. Terminal tapering is allowed for pads that
 * are narrower than the routed trace body. This runs at the solver boundary
 * before a result is cached or accepted into Circuit JSON.
 */
export const assertAutoroutedTraceWidthsMeetSourceMinimums = ({
  simpleRouteJson,
  outputPcbTraces,
  sourceTraces,
}: {
  simpleRouteJson: SimpleRouteJson
  outputPcbTraces: SimplifiedPcbTrace[]
  sourceTraces: SourceTrace[]
}): void => {
  const sourceTraceMinimumWidthById = new Map<SourceTraceId, number>()
  for (const sourceTrace of sourceTraces) {
    if (sourceTrace.min_trace_thickness === undefined) continue
    sourceTraceMinimumWidthById.set(
      sourceTrace.source_trace_id,
      sourceTrace.min_trace_thickness,
    )
  }
  if (sourceTraceMinimumWidthById.size === 0) return

  const sourceTraceIdsBySrjConnectionAlias =
    getSourceTraceIdsBySrjConnectionAlias({
      srjConnections: simpleRouteJson.connections,
      sourceTraceMinimumWidthById,
    })

  for (const outputPcbTrace of outputPcbTraces) {
    const sourceTraceIds = getOutputTraceSourceTraceIds({
      outputPcbTrace,
      sourceTraceIdsBySrjConnectionAlias,
    })
    if (sourceTraceIds.size === 0) continue

    let requiredMinimumWidth = 0
    for (const sourceTraceId of sourceTraceIds) {
      requiredMinimumWidth = Math.max(
        requiredMinimumWidth,
        sourceTraceMinimumWidthById.get(sourceTraceId) ?? 0,
      )
    }

    const finiteOutputWidths = outputPcbTrace.route.flatMap((routePoint) =>
      "width" in routePoint && Number.isFinite(routePoint.width)
        ? [routePoint.width]
        : [],
    )
    const maximumOutputWidth =
      finiteOutputWidths.length > 0 ? Math.max(...finiteOutputWidths) : null
    if (
      maximumOutputWidth === null ||
      maximumOutputWidth + WIDTH_COMPARISON_TOLERANCE_MM < requiredMinimumWidth
    ) {
      const outputWidthDescription =
        maximumOutputWidth === null
          ? "no finite width"
          : `maximum width ${maximumOutputWidth}mm`
      throw new AutorouterError(
        `Autorouter output trace "${outputPcbTrace.pcb_trace_id}" has ${outputWidthDescription}, below min_trace_thickness ${requiredMinimumWidth}mm required by source trace ${[...sourceTraceIds].join(", ")}`,
      )
    }
  }
}
