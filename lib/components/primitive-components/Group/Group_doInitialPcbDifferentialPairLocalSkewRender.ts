import {
  type UnmeasuredPair,
  computeLocalSkew,
} from "lib/utils/local-skew/compute-local-skew"
import type { UnstitchableReason } from "lib/utils/local-skew/stitch-side"
import type { Group } from "./Group"

/** What each reason a side's PCB traces cannot be put in order says about them. */
const UNSTITCHABLE_REASON_TEXT: Record<UnstitchableReason, string> = {
  not_two_pins: "connect more or fewer than two pins",
  pins_not_joined: "do not join its two pins",
  more_than_one_route: "join its two pins by more than one route",
}

/**
 * Adds local skew for every differential pair that couples, once routing
 * and teardrops are done, and a warning for each routed pair whose PCB
 * traces could not be put in order.
 */
export function Group_doInitialPcbDifferentialPairLocalSkewRender(
  group: Pick<Group, "root">,
): void {
  if (group.root?.firstChild !== group || group.root.pcbDisabled) return
  const { db } = group.root
  if (!db.source_bus.list().some((bus) => bus.differential_pair)) return

  const { localSkews, unmeasuredPairs } = computeLocalSkew({
    circuitJson: db.toArray(),
  })
  for (const localSkew of localSkews) {
    db.pcb_differential_pair_local_skew.insert(localSkew)
  }
  for (const unmeasuredPair of unmeasuredPairs) {
    const warning: Parameters<
      typeof db.pcb_bus_routing_constraint_warning.insert
    >[0] = {
      warning_type: "pcb_bus_routing_constraint_warning",
      routing_rule: "route_geometry",
      source_bus_id: unmeasuredPair.sourceBus.source_bus_id,
      source_trace_ids: [unmeasuredPair.sourceTrace.source_trace_id],
      pcb_trace_ids: unmeasuredPair.pcbTraces.map(
        (pcbTrace) => pcbTrace.pcb_trace_id,
      ),
      message: unmeasuredPairMessage(unmeasuredPair),
    }
    if (unmeasuredPair.sourceBus.subcircuit_id !== undefined) {
      warning.subcircuit_id = unmeasuredPair.sourceBus.subcircuit_id
    }
    db.pcb_bus_routing_constraint_warning.insert(warning)
  }
}

/** Names the pair, the side and why its PCB traces could not be put in order. */
function unmeasuredPairMessage({
  sourceBus,
  sourceTrace,
  reason,
}: UnmeasuredPair): string {
  const pairName = sourceBus.name ?? sourceBus.source_bus_id
  const sideName =
    sourceTrace.name ?? sourceTrace.display_name ?? sourceTrace.source_trace_id
  return `Local skew was not computed for differential pair "${pairName}": the PCB traces of ${sideName} ${UNSTITCHABLE_REASON_TEXT[reason]}`
}
