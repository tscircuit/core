import type { SourceTrace } from "circuit-json"
import type { DifferentialPair } from "lib/components/primitive-components/DifferentialPair"
import { getDifferentialPairSourceTraceOrThrow } from "./getDifferentialPairsForSimpleRouteJson"

/** Resolve pair membership before net aggregation loses named path identity. */
export const getDifferentialPairSourceTraceIds = ({
  differentialPairs,
  sourceTraces,
  subcircuitId,
}: {
  differentialPairs: DifferentialPair[]
  sourceTraces: SourceTrace[]
  subcircuitId?: SourceTrace["subcircuit_id"] | null
}): Set<SourceTrace["source_trace_id"]> => {
  const sourceTraceIds = new Set<SourceTrace["source_trace_id"]>()
  for (const differentialPair of differentialPairs) {
    const pairSubcircuitId = differentialPair.getSubcircuit().subcircuit_id
    if (subcircuitId && pairSubcircuitId !== subcircuitId) continue
    const differentialPairSourceTraces = sourceTraces.filter(
      (trace) => trace.subcircuit_id === pairSubcircuitId,
    )
    for (const traceNameOrPortSelector of [
      differentialPair._parsedProps.positiveConnection,
      differentialPair._parsedProps.negativeConnection,
    ]) {
      sourceTraceIds.add(
        getDifferentialPairSourceTraceOrThrow({
          differentialPair,
          differentialPairSourceTraces,
          traceNameOrPortSelector,
        }).sourceTraceId,
      )
    }
  }
  return sourceTraceIds
}
