import type { PcbTrace, PcbVia } from "circuit-json"
import type { SimplifiedPcbTrace } from "lib/utils/autorouting/SimpleRouteJson"
import type { Group } from "../Group"
import { getExistingPcbTracesForReroute } from "./get-existing-pcb-traces-for-reroute"
import { getSourceTraceIdsFromRerouteName } from "./get-source-trace-ids-from-reroute-name"

/**
 * Adds both the routed trace identifier and its pre-reroute source trace
 * identifier, since capacity-autorouter names replacement connections with a
 * `_reroute_` suffix.
 */
function addPossibleReplacementSourceTraceId(
  sourceTraceIds: Set<string>,
  value: unknown,
) {
  if (typeof value !== "string" || value.length === 0) return

  sourceTraceIds.add(value)

  for (const sourceTraceId of getSourceTraceIdsFromRerouteName(value)) {
    sourceTraceIds.add(sourceTraceId)
  }
}

function getInflatedDescendantSubcircuitIds(group: Group<any>): Set<string> {
  const subcircuitIds = new Set<string>()

  for (const component of group.getDescendants()) {
    if (!component.isSubcircuit) continue

    const subcircuit = component.getSubcircuit()
    if (!subcircuit._isInflatedFromCircuitJson || !subcircuit.subcircuit_id)
      continue
    subcircuitIds.add(subcircuit.subcircuit_id)
  }

  return subcircuitIds
}

/**
 * Removes existing PCB traces, plus their vias, when a reroute phase returns
 * replacement traces for the same source connection.
 */
export function deleteExistingPcbTracesReplacedBy({
  group,
  outputPcbTraces,
}: {
  group: Group<any>
  outputPcbTraces: Array<SimplifiedPcbTrace | PcbTrace | PcbVia>
}) {
  const db = group.root?.db
  if (!db) return

  const replacementPcbTraceIds = new Set<string>()
  const replacementSourceTraceIds = new Set<string>()
  const inflatedDescendantSubcircuitIds =
    getInflatedDescendantSubcircuitIds(group)

  for (const trace of outputPcbTraces) {
    if (trace.type !== "pcb_trace") continue

    const replacementTrace = trace as PcbTrace &
      SimplifiedPcbTrace & {
        rootConnectionName?: string
      }

    replacementPcbTraceIds.add(replacementTrace.pcb_trace_id)
    addPossibleReplacementSourceTraceId(
      replacementSourceTraceIds,
      replacementTrace.source_trace_id,
    )
    addPossibleReplacementSourceTraceId(
      replacementSourceTraceIds,
      replacementTrace.connection_name,
    )
    addPossibleReplacementSourceTraceId(
      replacementSourceTraceIds,
      replacementTrace.rootConnectionName,
    )
  }

  if (
    replacementPcbTraceIds.size === 0 &&
    replacementSourceTraceIds.size === 0
  ) {
    return
  }

  const tracesToDelete = getExistingPcbTracesForReroute(group).filter(
    (trace) => {
      const canReplaceTrace =
        trace.subcircuit_id === group.subcircuit_id ||
        Boolean(
          trace.subcircuit_id &&
            inflatedDescendantSubcircuitIds.has(trace.subcircuit_id),
        )
      if (!canReplaceTrace) return false
      if (replacementPcbTraceIds.has(trace.pcb_trace_id)) return true
      if (
        !trace.source_trace_id ||
        !replacementSourceTraceIds.has(trace.source_trace_id)
      ) {
        return false
      }
      return true
    },
  )

  if (tracesToDelete.length === 0) return

  const deletedPcbTraceIds = new Set(
    tracesToDelete.map((trace) => trace.pcb_trace_id),
  )

  for (const via of db.pcb_via.list()) {
    if (via.pcb_trace_id && deletedPcbTraceIds.has(via.pcb_trace_id)) {
      db.pcb_via.delete(via.pcb_via_id)
    }
  }

  for (const trace of tracesToDelete) {
    db.pcb_trace.delete(trace.pcb_trace_id)
  }
}
