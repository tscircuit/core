import type { SourceNet, SourceTrace } from "circuit-json"
import type { DifferentialPair } from "lib/components/primitive-components/DifferentialPair"
import type { Net } from "lib/components/primitive-components/Net"
import type { Port } from "lib/components/primitive-components/Port/Port"

type DifferentialPairMemberMatch =
  | { kind: "trace"; sourceTraces: SourceTrace[] }
  | { kind: "net"; sourceNet: SourceNet }

export type DifferentialPairMember =
  | { kind: "trace"; sourceTrace: SourceTrace }
  | { kind: "net"; sourceNet: SourceNet }

/** Shared selector lookup for source DRC and routing; a net never becomes a trace. */
export const findDifferentialPairMember = (
  differentialPair: DifferentialPair,
  sourceTraces: SourceTrace[],
  connectionSelector: string,
): DifferentialPairMemberMatch => {
  const namedTraces = sourceTraces.filter(
    (sourceTrace) => sourceTrace.name === connectionSelector,
  )
  if (namedTraces.length > 0) {
    return { kind: "trace", sourceTraces: namedTraces }
  }

  const selected = differentialPair
    .getSubcircuit()
    .selectOne(connectionSelector)
  if (selected?.lowercaseComponentName === "port") {
    const sourcePortId = (selected as Port).source_port_id
    return {
      kind: "trace",
      sourceTraces: sourceTraces.filter((sourceTrace) =>
        sourceTrace.connected_source_port_ids.includes(sourcePortId!),
      ),
    }
  }
  if (selected?.lowercaseComponentName === "net") {
    const sourceNet = differentialPair.root!.db.source_net.get(
      (selected as Net).source_net_id!,
    )!
    return { kind: "net", sourceNet }
  }
  return { kind: "trace", sourceTraces: [] }
}

export const resolveDifferentialPairMemberOrThrow = (
  differentialPair: DifferentialPair,
  sourceTraces: SourceTrace[],
  connectionSelector: string,
): DifferentialPairMember => {
  const match = findDifferentialPairMember(
    differentialPair,
    sourceTraces,
    connectionSelector,
  )
  if (match.kind === "net") return match
  if (match.sourceTraces.length === 0) {
    throw new Error(
      `Could not resolve differential pair selector "${connectionSelector}" in differential pair "${differentialPair.name}": expected a trace name, port selector, or net selector with connected traces`,
    )
  }
  if (match.sourceTraces.length > 1) {
    throw new Error(
      `Trace name or port selector "${connectionSelector}" matches multiple source traces for differential pair "${differentialPair.name}"`,
    )
  }
  return { kind: "trace", sourceTrace: match.sourceTraces[0] }
}
