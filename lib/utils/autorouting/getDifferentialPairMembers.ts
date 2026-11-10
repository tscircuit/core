import type { SourceTrace } from "circuit-json"
import type { DifferentialPair } from "lib/components/primitive-components/DifferentialPair"
import {
  type DifferentialPairMember,
  resolveDifferentialPairMemberOrThrow,
} from "./resolveDifferentialPairMember"

/** Resolve pair membership before net aggregation loses named path identity. */
export const getDifferentialPairMembers = ({
  differentialPairs,
  sourceTraces,
  subcircuitId,
}: {
  differentialPairs: DifferentialPair[]
  sourceTraces: SourceTrace[]
  subcircuitId?: SourceTrace["subcircuit_id"] | null
}): DifferentialPairMember[] => {
  const members: DifferentialPairMember[] = []
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
      const member = resolveDifferentialPairMemberOrThrow(
        differentialPair,
        differentialPairSourceTraces,
        traceNameOrPortSelector,
      )
      members.push(member)
    }
  }
  return members
}
