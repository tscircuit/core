import type { PcbTrace } from "circuit-json"
import type {
  SimpleRouteConnection,
  SimpleRouteJson,
  SimplifiedPcbTrace,
  SrjConnectionName,
} from "./SimpleRouteJson"

type RoutedTraceWithSource = SimplifiedPcbTrace &
  Pick<PcbTrace, "source_trace_id">

/**
 * Route explicit branches of mixed-width nets before their residual net
 * connections. Pipeline9 merges connections sharing terminals before choosing
 * widths, so pass the completed branches back as fixed copper. SRJ terminals
 * and routes are board-world points in right-handed millimeters (+X right,
 * +Y up, +Z above); all passes use the same coordinate frame.
 */
export async function routeMixedWidthNetConnections(
  srj: SimpleRouteJson,
  route: (input: SimpleRouteJson) => Promise<SimplifiedPcbTrace[]>,
): Promise<SimplifiedPcbTrace[]> {
  const connectionsByName = new Map(
    srj.connections.map((connection) => [connection.name, connection]),
  )
  const coupledConnectionNames = new Set([
    ...(srj.buses ?? []).flatMap((bus) => bus.connectionNames),
    ...(srj.differentialPairs ?? []).flatMap((pair) => pair.connectionNames),
  ])
  const branchesByNetName = new Map<
    SrjConnectionName,
    SimpleRouteConnection[]
  >()
  for (const connection of srj.connections) {
    const netName = connection.netConnectionName
    if (
      !connection.source_trace_id ||
      !netName ||
      coupledConnectionNames.has(connection.name)
    )
      continue

    const netConnection = connectionsByName.get(netName)
    if (
      !netConnection ||
      connection.nominalTraceWidth === netConnection.nominalTraceWidth
    )
      continue

    const netBranches = branchesByNetName.get(netName) ?? []
    netBranches.push(connection)
    branchesByNetName.set(netName, netBranches)
  }
  if (branchesByNetName.size === 0) return route(srj)

  const branchBatches: SimpleRouteConnection[][] = []
  const branchNames = new Set<SrjConnectionName>()
  for (const netBranches of branchesByNetName.values()) {
    netBranches.sort(
      (a, b) => (b.nominalTraceWidth ?? 0) - (a.nominalTraceWidth ?? 0),
    )
    for (const [batchIndex, branch] of netBranches.entries()) {
      branchNames.add(branch.name)
      const batch = (branchBatches[batchIndex] ??= [])
      // One branch per net keeps its authored width and source ownership.
      batch.push({ ...branch, netConnectionName: undefined })
    }
  }

  const routedBranches: RoutedTraceWithSource[] = []
  const fixedBranches: SimplifiedPcbTrace[] = []
  const fixedInputTraces = (srj.traces ?? []).map((trace) => ({
    ...trace,
    isFixed: true,
  }))
  for (const batch of branchBatches) {
    const batchOutput = await route({
      ...srj,
      connections: batch,
      traces: [...fixedInputTraces, ...fixedBranches],
      buses: undefined,
      differentialPairs: undefined,
    })
    for (const trace of batchOutput) {
      const branch =
        trace.connection_name && connectionsByName.get(trace.connection_name)
      routedBranches.push({
        ...trace,
        source_trace_id: branch ? branch.source_trace_id : undefined,
      })
      fixedBranches.push({ ...trace, isFixed: true })
    }
  }

  const residualOutput = await route({
    ...srj,
    connections: srj.connections.filter(
      (connection) => !branchNames.has(connection.name),
    ),
    traces: [...(srj.traces ?? []), ...fixedBranches],
  })
  return [
    ...routedBranches,
    ...residualOutput.map(
      (trace): RoutedTraceWithSource =>
        trace.connection_name && branchesByNetName.has(trace.connection_name)
          ? { ...trace, source_trace_id: trace.connection_name }
          : trace,
    ),
  ]
}
