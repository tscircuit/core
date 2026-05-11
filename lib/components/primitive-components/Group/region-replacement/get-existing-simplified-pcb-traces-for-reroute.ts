import type { SimplifiedPcbTrace } from "lib/utils/autorouting/SimpleRouteJson"
import type { Group } from "../Group"
import { convertPcbTraceToSimplifiedPcbTrace } from "./convert-pcb-trace-to-simplified-pcb-trace"
import { getExistingPcbTracesForReroute } from "./get-existing-pcb-traces-for-reroute"

/**
 * Builds the simplified trace seed list passed to capacity-autorouter when a
 * region reroute needs to preserve all existing traces outside the region.
 */
export function getExistingSimplifiedPcbTracesForReroute(
  group: Group<any>,
): SimplifiedPcbTrace[] {
  return getExistingPcbTracesForReroute(group).map(
    convertPcbTraceToSimplifiedPcbTrace,
  )
}
