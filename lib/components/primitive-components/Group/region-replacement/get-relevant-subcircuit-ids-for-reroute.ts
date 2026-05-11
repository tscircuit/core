import { getDescendantSubcircuitIds } from "lib/utils/autorouting/getAncestorSubcircuitIds"
import type { Group } from "../Group"

/**
 * Finds the current group subcircuit and all descendant subcircuits whose
 * already-rendered traces should be eligible for region replacement.
 */
export function getRelevantSubcircuitIdsForReroute(
  group: Group<any>,
): Set<string> {
  const relevantSubcircuitIds = new Set<string>()
  if (!group.subcircuit_id) return relevantSubcircuitIds

  relevantSubcircuitIds.add(group.subcircuit_id)

  const db = group.root?.db
  if (!db) return relevantSubcircuitIds

  for (const subcircuitId of getDescendantSubcircuitIds(
    db,
    group.subcircuit_id,
  )) {
    relevantSubcircuitIds.add(subcircuitId)
  }

  return relevantSubcircuitIds
}
