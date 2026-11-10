import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import {
  source_differential_pair_bus,
  type SourceDifferentialPairBus,
  type SourcePort,
  type SourceTrace,
} from "circuit-json"
import { getFullConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"

type SourcePortId = SourcePort["source_port_id"]
type SourceTraceId = SourceTrace["source_trace_id"]

/** Validate source intent before any routing-scope filtering, including saved JSON. */
export function validateDifferentialPairSourceBuses(
  db: CircuitJsonUtilObjects,
): SourceDifferentialPairBus[] {
  const pairs = db.source_bus.list().filter((bus) => bus.differential_pair)
  if (!pairs.length) return []
  const connectivity = getFullConnectivityMapFromCircuitJson(db.toArray())
  const sourceTraces = db.source_trace.list()
  const sourcePorts = db.source_port.list()
  const ownerBySourceTraceId = new Map<
    SourceTraceId,
    SourceDifferentialPairBus
  >()
  const validatedPairs: SourceDifferentialPairBus[] = []

  for (const rawPair of pairs) {
    const label = `Differential pair "${rawPair.name || "unnamed pair"}"`
    const fail = (detail: string): never => {
      throw new Error(`${label}: ${detail}`)
    }
    const parsed = source_differential_pair_bus.safeParse(rawPair)
    if (!parsed.success) {
      fail(
        "invalid source_bus; use nonempty, unique ordered lanes, exactly their combined membership and an explicit finite nonnegative max_length_skew; only lane-length skew is supported",
      )
    }
    const pair = parsed.data!
    validatedPairs.push(pair)
    const lanes = [
      pair.differential_pair.positive_source_trace_ids,
      pair.differential_pair.negative_source_trace_ids,
    ]
    const laneTraces = lanes.map((ids) =>
      ids.map((sourceTraceId) => {
        const trace = db.source_trace.get(sourceTraceId)
        if (!trace || trace.subcircuit_id !== pair.subcircuit_id)
          fail("a hop is missing or belongs to another subcircuit")
        const hop = trace!
        const traceLabel = `trace "${hop.name || "unnamed trace"}"`
        const owner = ownerBySourceTraceId.get(sourceTraceId)
        if (owner)
          fail(
            `${traceLabel} is already owned by differential pair "${owner.name || "unnamed pair"}"`,
          )
        ownerBySourceTraceId.set(sourceTraceId, pair)
        if (
          hop.connected_source_port_ids.length !== 2 ||
          new Set(hop.connected_source_port_ids).size !== 2
        )
          fail(`${traceLabel} must have exactly two distinct ports`)
        if (
          hop.connected_source_port_ids.some(
            (id) => !db.source_port.get(id)?.source_component_id,
          )
        )
          fail(
            `${traceLabel} has a missing terminal or a terminal without an owning component`,
          )
        return hop
      }),
    )

    const canJoin = (exit: SourcePortId, entry: SourcePortId): boolean => {
      if (exit === entry) return true
      const exitPort = db.source_port.get(exit)!
      const entryPort = db.source_port.get(entry)!
      if (exitPort.source_component_id !== entryPort.source_component_id)
        return false
      const component = db.source_component.get(exitPort.source_component_id!)!
      return (
        ["simple_resistor", "simple_capacitor", "simple_inductor"].includes(
          component.ftype,
        ) &&
        sourcePorts.filter(
          (port) => port.source_component_id === component.source_component_id,
        ).length === 2
      )
    }
    for (const hops of laneTraces) {
      // Try both orientations of the first edge, carrying visited physical pads
      // through the complete lane. Entering/leaving one pad twice is a fork/loop.
      const walk = (
        hopIndex: number,
        exit: SourcePortId,
        visited: Set<SourcePortId>,
      ): number => {
        if (hopIndex === hops.length) return 1
        let orientations = 0
        const [a, b] = hops[hopIndex]!.connected_source_port_ids
        for (const [entry, nextExit] of [
          [a!, b!],
          [b!, a!],
        ]) {
          if (
            !canJoin(exit, entry) ||
            visited.has(nextExit) ||
            (entry !== exit && visited.has(entry))
          )
            continue
          orientations += walk(
            hopIndex + 1,
            nextExit,
            new Set([...visited, entry, nextExit]),
          )
        }
        return orientations
      }
      if (hops.length > 1) {
        const [a, b] = hops[0]!.connected_source_port_ids
        const orientations =
          walk(1, b!, new Set([a!, b!])) + walk(1, a!, new Set([a!, b!]))
        if (orientations !== 1)
          fail(
            "hops must have one consistent signal order; adjacent hops must share a pad or cross the two terminals of a resistor, capacitor or inductor. Unsupported bridge (including chips and chokes), fork, loop or backtracking",
          )
      }
      const sections = new Set<string>()
      for (const hop of hops) {
        const section = [...hop.connected_source_port_ids].sort().join("/")
        if (sections.has(section))
          fail("the lane repeats an electrical section")
        sections.add(section)
      }
    }
    const positiveNets = new Set(
      laneTraces[0]!.flatMap((hop) =>
        hop.connected_source_port_ids.map((id) =>
          connectivity.getNetConnectedToId(id),
        ),
      ),
    )
    if (
      laneTraces[1]!.some((hop) =>
        hop.connected_source_port_ids.some((id) =>
          positiveNets.has(connectivity.getNetConnectedToId(id)),
        ),
      )
    )
      fail(
        "positive and negative lanes are electrically shorted (including internal shorts)",
      )
  }

  for (const bus of db.source_bus.list()) {
    if (bus.differential_pair) continue
    const references = [
      ...bus.source_trace_ids,
      ...(bus.length_match_source_trace_ids ?? []),
      ...[bus.min_length, bus.max_length, bus.target_length].flatMap(
        (length) =>
          typeof length === "object" ? (length.source_trace_ids ?? []) : [],
      ),
    ]
    for (const id of references) {
      const pair = ownerBySourceTraceId.get(id)
      if (pair)
        throw new Error(
          `Bus "${bus.name || "unnamed bus"}" overlaps differential pair "${pair.name || "unnamed pair"}" on trace "${sourceTraces.find((trace) => trace.source_trace_id === id)?.name || "unnamed trace"}"; ordinary bus and lengthMatchTo membership on owned hops is unsupported`,
        )
    }
  }
  return validatedPairs
}
