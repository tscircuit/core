import type { SimplifiedPcbTrace } from "lib/utils/autorouting/SimpleRouteJson"
import { applyNetTraceClearancesToSrj } from "lib/utils/autorouting/apply-net-trace-clearances-to-srj"
import type { Group } from "../Group"
import { convertPcbTraceToSimplifiedPcbTrace } from "./convert-pcb-trace-to-simplified-pcb-trace"
import { getExistingPcbTracesForReroute } from "./get-existing-pcb-traces-for-reroute"

/**
 * Builds the simplified trace seed list passed to capacity-autorouter when a
 * region reroute needs to preserve all existing traces outside the region.
 * Net clearance rules are resolved against the full circuit, matching the
 * traces produced by getSimpleRouteJsonFromCircuitJson.
 */
export function getExistingSimplifiedPcbTracesForReroute(
  group: Group<any>,
): SimplifiedPcbTrace[] {
  const traces = getExistingPcbTracesForReroute(group).map(
    convertPcbTraceToSimplifiedPcbTrace,
  )
  const db = group.root?.db
  if (db && traces.length > 0) {
    applyNetTraceClearancesToSrj({ circuitJson: db.toArray(), traces })
  }
  return traces
}
