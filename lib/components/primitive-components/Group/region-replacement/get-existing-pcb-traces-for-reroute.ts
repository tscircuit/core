import type { PcbTrace } from "circuit-json"
import type { Group } from "../Group"
import { getRelevantSubcircuitIdsForReroute } from "./get-relevant-subcircuit-ids-for-reroute"

/**
 * Returns existing PCB traces that can seed a region reroute for this group.
 * This includes descendant subcircuits so imported Circuit JSON can be rerouted
 * from the parent group that owns the autorouting phase.
 */
export function getExistingPcbTracesForReroute(group: Group<any>): PcbTrace[] {
  const db = group.root?.db
  if (!db) return []

  const relevantSubcircuitIds = getRelevantSubcircuitIdsForReroute(group)

  return db.pcb_trace.list().filter((trace) => {
    if (!trace.route || trace.route.length < 2) return false
    if (!group.subcircuit_id) return true

    return Boolean(
      trace.subcircuit_id && relevantSubcircuitIds.has(trace.subcircuit_id),
    )
  })
}
