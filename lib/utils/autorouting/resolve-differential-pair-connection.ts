import type { SourceNet, SourcePort, SourceTrace } from "circuit-json"
import type { DifferentialPair } from "lib/components/primitive-components/DifferentialPair"
import type { Port } from "lib/components/primitive-components/Port/Port"

export type SourcePortId = SourcePort["source_port_id"]
export type SourceNetId = SourceNet["source_net_id"]
export type SubcircuitId = NonNullable<SourceTrace["subcircuit_id"]>
export type SubcircuitConnectivityMapKey = NonNullable<
  SourceTrace["subcircuit_connectivity_map_key"]
>

export type ResolvedDifferentialPairConnection = {
  subcircuitConnectivityMapKey: SubcircuitConnectivityMapKey
  sourceTraces: SourceTrace[]
  sourcePorts: SourcePort[]
  sourceNet?: SourceNet
}

type ResolveDifferentialPairConnectionParams = {
  differentialPair: DifferentialPair
  traceNameOrPortSelector: string
  sourceTraces: SourceTrace[]
  sourcePorts: SourcePort[]
  sourceNets: SourceNet[]
}

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

/**
 * Resolves one differential-pair conductor to its complete source-connectivity
 * group. Multiple source-trace fragments are valid when they all belong to the
 * same group (for example two traces joined through a source net).
 */
export const resolveDifferentialPairConnectionOrThrow = ({
  differentialPair,
  traceNameOrPortSelector,
  sourceTraces,
  sourcePorts,
  sourceNets,
}: ResolveDifferentialPairConnectionParams): ResolvedDifferentialPairConnection => {
  const differentialPairSubcircuitId =
    differentialPair.getSubcircuit().subcircuit_id
  const differentialPairSourceTraces = sourceTraces.filter(
    (sourceTrace) => sourceTrace.subcircuit_id === differentialPairSubcircuitId,
  )
  const sourceTracesWithMatchingName =
    getDifferentialPairSourceTracesByTraceName(
      differentialPairSourceTraces,
      traceNameOrPortSelector,
    )
  let selectedPort: Port | null = null
  if (sourceTracesWithMatchingName.length === 0) {
    selectedPort = differentialPair
      .getSubcircuit()
      .selectOne<Port>(traceNameOrPortSelector, { type: "port" })
  }
  const selectedSourcePortId = selectedPort?.source_port_id ?? undefined
  let matchingSourceTraces = sourceTracesWithMatchingName
  if (selectedSourcePortId) {
    matchingSourceTraces = getDifferentialPairSourceTracesByPortId(
      differentialPairSourceTraces,
      selectedSourcePortId,
    )
  }

  if (matchingSourceTraces.length === 0) {
    throw new Error(
      `Could not find source trace for trace name or port selector "${traceNameOrPortSelector}" in differential pair "${differentialPair.name}"`,
    )
  }

  const subcircuitConnectivityMapKeys = new Set<SubcircuitConnectivityMapKey>()
  for (const sourceTrace of matchingSourceTraces) {
    if (sourceTrace.subcircuit_connectivity_map_key) {
      subcircuitConnectivityMapKeys.add(
        sourceTrace.subcircuit_connectivity_map_key,
      )
    }
  }
  if (subcircuitConnectivityMapKeys.size > 1) {
    throw new Error(
      `Trace name or port selector "${traceNameOrPortSelector}" matches multiple source traces for differential pair "${differentialPair.name}"`,
    )
  }

  const sourceTraceWithoutConnectivityMapKey = matchingSourceTraces.find(
    (sourceTrace) => !sourceTrace.subcircuit_connectivity_map_key,
  )
  if (sourceTraceWithoutConnectivityMapKey) {
    throw new Error(
      `Source trace "${sourceTraceWithoutConnectivityMapKey.source_trace_id}" does not have a subcircuit connectivity map key for differential pair "${differentialPair.name}"`,
    )
  }

  const subcircuitConnectivityMapKey = subcircuitConnectivityMapKeys
    .values()
    .next().value
  if (!subcircuitConnectivityMapKey) {
    throw new Error(
      `Expected a subcircuit connectivity map key for trace name or port selector "${traceNameOrPortSelector}" in differential pair "${differentialPair.name}"`,
    )
  }

  const connectivityGroupSourceTraces = differentialPairSourceTraces.filter(
    (sourceTrace) =>
      sourceTrace.subcircuit_connectivity_map_key ===
      subcircuitConnectivityMapKey,
  )
  const terminalSourcePortIds = new Set(
    connectivityGroupSourceTraces.flatMap(
      (sourceTrace) => sourceTrace.connected_source_port_ids,
    ),
  )
  const sourcePortsById = new Map<SourcePortId, SourcePort>(
    sourcePorts.map((sourcePort) => [sourcePort.source_port_id, sourcePort]),
  )
  const sortedTerminalSourcePortIds = [...terminalSourcePortIds].sort(
    (sourcePortIdA, sourcePortIdB) =>
      sourcePortIdA.localeCompare(sourcePortIdB),
  )
  const connectivityGroupSourcePorts: SourcePort[] = []
  for (const sourcePortId of sortedTerminalSourcePortIds) {
    const sourcePort = sourcePortsById.get(sourcePortId)
    if (sourcePort) {
      connectivityGroupSourcePorts.push(sourcePort)
    }
  }

  const directlyReferencedSourceNetIds = matchingSourceTraces.flatMap(
    (sourceTrace) => sourceTrace.connected_source_net_ids,
  )
  const connectivityGroupSourceNetIds = connectivityGroupSourceTraces.flatMap(
    (sourceTrace) => sourceTrace.connected_source_net_ids,
  )
  const orderedSourceNetIds = [
    ...new Set([
      ...directlyReferencedSourceNetIds,
      ...connectivityGroupSourceNetIds.sort((sourceNetIdA, sourceNetIdB) =>
        sourceNetIdA.localeCompare(sourceNetIdB),
      ),
    ]),
  ]
  const sourceNetsById = new Map<SourceNetId, SourceNet>(
    sourceNets.map((sourceNet) => [sourceNet.source_net_id, sourceNet]),
  )

  let sourceNet: SourceNet | undefined
  for (const sourceNetId of orderedSourceNetIds) {
    const matchingSourceNet = sourceNetsById.get(sourceNetId)
    if (matchingSourceNet) {
      sourceNet = matchingSourceNet
      break
    }
  }

  return {
    subcircuitConnectivityMapKey,
    sourceTraces: connectivityGroupSourceTraces,
    sourcePorts: connectivityGroupSourcePorts,
    sourceNet,
  }
}
