import type { DifferentialPairConnection } from "@tscircuit/props"
import type { SourceTrace } from "circuit-json"
import { getFullConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"
import { validateDifferentialPairSourceBuses } from "lib/utils/autorouting/validateDifferentialPairSourceBuses"
import type { Net } from "./Net"
import type { Port } from "./Port/Port"
import type { DifferentialPair } from "./DifferentialPair"

/** Resolve authoring selectors once; every exported lane member is a real hop. */
export const DifferentialPair_doInitialSourceDesignRuleChecks = (
  pair: DifferentialPair,
): void => {
  const { db } = pair.root!
  const subcircuit = pair.getSubcircuit()
  const subcircuit_id = subcircuit.subcircuit_id!
  const traces = db.source_trace
    .list()
    .filter((trace) => trace.subcircuit_id === subcircuit_id)
  const connectivity = getFullConnectivityMapFromCircuitJson(db.toArray())
  const fail = (detail: string): never => {
    throw new Error(
      `Differential pair "${pair.name || "unnamed pair"}": ${detail}`,
    )
  }

  const resolve = (
    connection: DifferentialPairConnection,
  ): [string, ...string[]] => {
    const resolveHop = (
      selector: string,
      traceNamesOnly: boolean,
    ): SourceTrace => {
      const named = traces.filter((trace) => trace.name === selector)
      if (traceNamesOnly) {
        if (/[\s.>#:[\],*+~='"|]/.test(selector))
          fail("arrays must contain trace names only, not selectors")
        if (named.length !== 1)
          fail(`trace name "${selector}" must resolve to exactly one trace`)
        return named[0]!
      }
      const selected = subcircuit.selectAll(selector)
      if (named.length && /[\s.>#:[\],*+~='"|]/.test(selector))
        fail(
          `"${selector}" is ambiguous between a trace name and selector syntax`,
        )
      if (named.length === 1) return named[0]!
      if (named.length > 1 || selected.length > 1)
        fail(
          `trace name or port selector "${selector}" matches multiple source traces or terminals`,
        )
      const terminal = selected[0]
      let connectivityId: string | undefined
      if (terminal?.lowercaseComponentName === "port") {
        const sourcePortId = (terminal as Port).source_port_id!
        const matching = traces.filter((trace) =>
          trace.connected_source_port_ids.includes(sourcePortId),
        )
        if (matching.length !== 1)
          fail(
            `port selector "${selector}" must resolve to one source trace; it matches multiple source traces or has no connected trace`,
          )
        if (matching[0]!.connected_source_port_ids.length === 2)
          return matching[0]!
        connectivityId = connectivity.getNetConnectedToId(sourcePortId)
      } else if (terminal?.lowercaseComponentName === "net") {
        connectivityId = connectivity.getNetConnectedToId(
          (terminal as Net).source_net_id!,
        )
      } else {
        fail(
          `could not find source trace for trace name or port selector "${selector}"; expected a trace name, unambiguous port selector or two-pad net.X`,
        )
      }
      const ports = db.source_port
        .list()
        .filter(
          (port) =>
            connectivityId &&
            connectivity.getNetConnectedToId(port.source_port_id) ===
              connectivityId,
        )
      if (ports.length !== 2)
        fail(
          `${selector} has ${ports.length} pads; list the traces in order, e.g. positiveConnection={["DP1","DP2"]}`,
        )
      const ids = ports.map((port) => port.source_port_id)
      const canonical = traces.find(
        (trace) =>
          trace.connected_source_port_ids.length === 2 &&
          ids.every((id) => trace.connected_source_port_ids.includes(id)),
      )
      if (canonical) return canonical
      const fragments = traces.filter(
        (trace) =>
          connectivity.getNetConnectedToId(trace.source_trace_id) ===
          connectivityId,
      )
      const hop = db.source_trace.insert({
        connected_source_port_ids: ids,
        connected_source_net_ids: [
          ...new Set(
            fragments.flatMap((trace) => trace.connected_source_net_ids),
          ),
        ],
        subcircuit_connectivity_map_key:
          fragments[0]?.subcircuit_connectivity_map_key,
        min_trace_thickness:
          Math.max(
            0,
            ...fragments.map((trace) => trace.min_trace_thickness ?? 0),
          ) || undefined,
        subcircuit_id,
      })
      traces.push(hop)
      return hop
    }
    const selectors = typeof connection === "string" ? [connection] : connection
    if (!selectors.length) fail("lanes must not be empty")
    return selectors.map(
      (selector) =>
        resolveHop(selector, Array.isArray(connection)).source_trace_id,
    ) as [string, ...string[]]
  }

  const positive_source_trace_ids = resolve(
    pair._parsedProps.positiveConnection,
  )
  const negative_source_trace_ids = resolve(
    pair._parsedProps.negativeConnection,
  )
  db.source_bus.insert({
    name: pair.name,
    subcircuit_id,
    source_trace_ids: [
      ...positive_source_trace_ids,
      ...negative_source_trace_ids,
    ],
    max_length_skew: pair._parsedProps.maxLengthSkew,
    differential_pair: { positive_source_trace_ids, negative_source_trace_ids },
  })
  validateDifferentialPairSourceBuses(db)
}
