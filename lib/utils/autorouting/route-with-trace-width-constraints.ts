import type { SimpleRouteJson, SimplifiedPcbTrace } from "./SimpleRouteJson"
import { withFixedTraces } from "./with-fixed-traces"

/**
 * The capacity router has a job-wide hard minimum and per-connection nominal
 * widths. Route explicit minima in descending-width passes so a preference
 * cannot relax the whole route below a source trace's minimum. The router's
 * endpoint pad neckdowns still apply. Previous copper stays fixed, with
 * clearance checked by the next routing pass rather than widening its output.
 * Points remain in board-world mm (+X right, +Y up, +Z above, right-handed).
 */
export async function routeWithTraceWidthConstraints(
  input: SimpleRouteJson,
  route: (input: SimpleRouteJson) => Promise<SimplifiedPcbTrace[]>,
): Promise<SimplifiedPcbTrace[]> {
  if (
    !input.connections.some(
      (connection) =>
        (connection.minTraceWidth ?? input.minTraceWidth) > input.minTraceWidth,
    )
  ) {
    return route(input)
  }

  const connectionByName = new Map(
    input.connections.map((connection) => [connection.name, connection]),
  )
  const minimumWidthByConnection = new Map(
    input.connections.map((connection) => [
      connection,
      Math.max(input.minTraceWidth, connection.minTraceWidth ?? 0),
    ]),
  )
  // Coupled connections must remain in the same pass. Propagate the largest
  // minimum through overlapping buses/pairs before grouping by width.
  const coupledConnectionNames = [
    ...(input.differentialPairs ?? []).map((pair) => pair.connectionNames),
    ...(input.buses ?? []).map((bus) => bus.connectionNames),
  ]
  let changed = true
  while (changed) {
    changed = false
    for (const connectionNames of coupledConnectionNames) {
      const connections = connectionNames.flatMap((name) => {
        const connection = connectionByName.get(name)
        return connection ? [connection] : []
      })
      const minimumWidth = Math.max(
        input.minTraceWidth,
        ...connections.map(
          (connection) => minimumWidthByConnection.get(connection)!,
        ),
      )
      for (const connection of connections) {
        if (minimumWidthByConnection.get(connection) === minimumWidth) continue
        minimumWidthByConnection.set(connection, minimumWidth)
        changed = true
      }
    }
  }

  const minimumWidths = [...new Set(minimumWidthByConnection.values())].sort(
    (a, b) => b - a,
  )
  const traces = [...(input.traces ?? [])]
  for (const minTraceWidth of minimumWidths) {
    const connections = input.connections.filter(
      (connection) =>
        minimumWidthByConnection.get(connection) === minTraceWidth,
    )
    const connectionNames = new Set(
      connections.map((connection) => connection.name),
    )
    const passInput = withFixedTraces(
      {
        ...input,
        connections: connections.map((connection) => ({
          ...connection,
          nominalTraceWidth: Math.max(
            minTraceWidth,
            connection.nominalTraceWidth ?? minTraceWidth,
          ),
          width: Math.max(minTraceWidth, connection.width ?? minTraceWidth),
        })),
        minTraceWidth,
        nominalTraceWidth: Math.max(
          minTraceWidth,
          input.nominalTraceWidth ?? minTraceWidth,
        ),
        traces,
        differentialPairs: input.differentialPairs?.filter((pair) =>
          pair.connectionNames.every((name) => connectionNames.has(name)),
        ),
        buses: input.buses?.filter((bus) =>
          bus.connectionNames.some((name) => connectionNames.has(name)),
        ),
      },
      new Set(traces.map((trace) => trace.pcb_trace_id)),
    )
    traces.push(...(await route(passInput)))
  }
  return traces
}
