import type { SourceBus } from "circuit-json"
import { computeLocalSkew } from "lib/utils/local-skew/compute-local-skew"
import type {
  PcbDifferentialPairLocalSkew,
  PcbDifferentialPairLocalSkewInsert,
} from "lib/utils/local-skew/pcb-differential-pair-local-skew"
import type { Group } from "./Group"

const PHASE_NAME = "PcbDifferentialPairLocalSkewRender"

export function Group_doInitialPcbDifferentialPairLocalSkewRender(
  group: Pick<Group, "root">,
) {
  if (group.root?.firstChild !== group || group.root.pcbDisabled) return
  const { db } = group.root

  // The Circuit JSON database supports new element tables by name at runtime.
  const { pcb_differential_pair_local_skew: localSkewTable } =
    db as typeof db & {
      pcb_differential_pair_local_skew: {
        list(): PcbDifferentialPairLocalSkew[]
        insert(pair: PcbDifferentialPairLocalSkewInsert): void
        delete(
          id: PcbDifferentialPairLocalSkew["pcb_differential_pair_local_skew_id"],
        ): void
      }
    }
  for (const pair of localSkewTable.list()) {
    localSkewTable.delete(pair.pcb_differential_pair_local_skew_id)
  }
  for (const error of db.source_runtime_error.list({
    phase_name: PHASE_NAME,
  })) {
    db.source_runtime_error.delete(error.source_runtime_error_id)
  }
  for (const warning of db.pcb_bus_routing_constraint_warning.list()) {
    if (!warning.message.startsWith(SPLIT_PAIR_MESSAGE_START)) continue
    db.pcb_bus_routing_constraint_warning.delete(
      warning.pcb_bus_routing_constraint_warning_id,
    )
  }
  if (!db.source_bus.list().some((bus) => bus.differential_pair)) return

  const { pairs, splitPairs, failedPairs } = computeLocalSkew({
    circuitJson: db.toArray(),
  })
  for (const pair of pairs) localSkewTable.insert(pair)
  for (const { bus, positiveTraces, negativeTraces } of splitPairs) {
    const splitTraces = [positiveTraces, negativeTraces].filter(
      (traces) => traces.length > 1,
    )
    db.pcb_bus_routing_constraint_warning.insert({
      warning_type: "pcb_bus_routing_constraint_warning",
      routing_rule: "route_geometry",
      source_bus_id: bus.source_bus_id,
      source_trace_ids: [
        ...new Set(splitTraces.flat().map((trace) => trace.source_trace_id!)),
      ],
      pcb_trace_ids: splitTraces.flat().map((trace) => trace.pcb_trace_id),
      subcircuit_id: bus.subcircuit_id,
      message: `${SPLIT_PAIR_MESSAGE_START} ${describePair(bus)}: ${describeSplitSides({ positiveTraceCount: positiveTraces.length, negativeTraceCount: negativeTraces.length })}, and local skew follows one PCB trace per side.`,
    })
  }
  for (const { bus, reason } of failedPairs) {
    db.source_runtime_error.insert({
      error_type: "source_runtime_error",
      phase_name: PHASE_NAME,
      message: `Could not calculate local skew for differential pair ${describePair(bus)}: ${reason}`,
    })
  }
}

/** Starts this phase's warning for a pair routed as several PCB traces per side, so a rerun replaces only its own warnings. */
const SPLIT_PAIR_MESSAGE_START = "No local skew for differential pair"

/** The pair's name and IDs, for a diagnostic message. */
function describePair(bus: SourceBus): string {
  const ids = [bus.source_bus_id, bus.subcircuit_id].filter(
    (id) => id !== undefined,
  )
  if (bus.name === undefined) return `(${ids.join(" in ")})`
  return `"${bus.name}" (${ids.join(" in ")})`
}

/** Which sides of a pair are routed as several PCB traces, e.g. "the positive side is routed as 2 PCB traces". */
function describeSplitSides({
  positiveTraceCount,
  negativeTraceCount,
}: {
  positiveTraceCount: number
  negativeTraceCount: number
}): string {
  const sides: string[] = []
  if (positiveTraceCount > 1) {
    sides.push(
      `the positive side is routed as ${positiveTraceCount} PCB traces`,
    )
  }
  if (negativeTraceCount > 1) {
    sides.push(
      `the negative side is routed as ${negativeTraceCount} PCB traces`,
    )
  }
  return sides.join(" and ")
}
