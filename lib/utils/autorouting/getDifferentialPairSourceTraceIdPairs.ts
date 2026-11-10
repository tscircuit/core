import type { SourceTrace } from "circuit-json"
import type { DifferentialPair } from "lib/components/primitive-components/DifferentialPair"
import { getDifferentialPairSourceTraceOrThrow } from "./getDifferentialPairsForSimpleRouteJson"

type SourceTraceId = SourceTrace["source_trace_id"]

/** Resolve both members of each pair before aggregating their nets. */
export const getDifferentialPairSourceTraceIdPairs = ({
  differentialPairs,
  sourceTraces,
  subcircuitId,
}: {
  differentialPairs: DifferentialPair[]
  sourceTraces: SourceTrace[]
  subcircuitId?: SourceTrace["subcircuit_id"] | null
}): Array<[SourceTraceId, SourceTraceId]> => {
  const sourceTraceIdPairs: Array<[SourceTraceId, SourceTraceId]> = []
  for (const differentialPair of differentialPairs) {
    const pairSubcircuitId = differentialPair.getSubcircuit().subcircuit_id
    if (subcircuitId && pairSubcircuitId !== subcircuitId) continue
    const differentialPairSourceTraces = sourceTraces.filter(
      (trace) => trace.subcircuit_id === pairSubcircuitId,
    )
    sourceTraceIdPairs.push([
      getDifferentialPairSourceTraceOrThrow({
        differentialPair,
        differentialPairSourceTraces,
        traceNameOrPortSelector:
          differentialPair._parsedProps.positiveConnection,
      }).sourceTraceId,
      getDifferentialPairSourceTraceOrThrow({
        differentialPair,
        differentialPairSourceTraces,
        traceNameOrPortSelector:
          differentialPair._parsedProps.negativeConnection,
      }).sourceTraceId,
    ])
  }
  return sourceTraceIdPairs
}
