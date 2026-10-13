import type { SourceTrace } from "circuit-json"
import type { Bus } from "lib/components/primitive-components/Bus"
import { getTraceLength } from "lib/components/primitive-components/Trace/trace-utils/compute-trace-length"
import type { SimpleRouteBus } from "./SimpleRouteJson"
import { getBusTargetLengthBounds } from "./getBusTargetLengthBounds"
import { RoutingPhasePreparationError } from "./routing-phase-preparation-error"

type SourceTraceId = SourceTrace["source_trace_id"]

/** Resolves total member lengths in mm from board-world copper (+X right, +Y up).
 * Uses the same trace_length / route measurement as PCB length DRC. Fully routed
 * members stay fixed; their lengths bound the pending members, without adding
 * duplicate routing connections or changing the declared source bus.
 */
export const getPreservedBusLengthBoundsForSrjOrThrow = ({
  bus,
  preservedSourceTraceIds,
}: {
  bus: Bus
  preservedSourceTraceIds: ReadonlySet<SourceTraceId>
}): Pick<SimpleRouteBus, "minLength" | "maxLength"> => {
  const bounds = getBusTargetLengthBounds(bus)
  const skew = bus._parsedProps.maxLengthSkew
  if (
    preservedSourceTraceIds.size === 0 ||
    (skew === undefined && bounds.minLength === undefined)
  )
    return bounds

  const { db } = bus.root!
  const fixedMembers = [...preservedSourceTraceIds].map((sourceTraceId) => ({
    name: db.source_trace.get(sourceTraceId)?.name || "unnamed trace",
    length: db.pcb_trace
      .list()
      .filter((trace) => trace.source_trace_id === sourceTraceId)
      .reduce(
        (sum, trace) =>
          sum + (trace.trace_length ?? getTraceLength(trace.route)),
        0,
      ),
  }))
  const busName = bus.name || "unnamed bus"
  const tolerance = 1e-9
  for (const member of fixedMembers) {
    if (
      (bounds.minLength !== undefined &&
        member.length < bounds.minLength - tolerance) ||
      (bounds.maxLength !== undefined &&
        member.length > bounds.maxLength + tolerance)
    ) {
      throw new RoutingPhasePreparationError(
        `Length-matched bus "${busName}" has pre-routed member "${member.name}" at ${member.length.toFixed(3)} mm, outside its target range ${bounds.minLength?.toFixed(3)}–${bounds.maxLength?.toFixed(3)} mm. Adjust the fixed route or the target length.`,
      )
    }
  }
  if (skew === undefined) return bounds
  const shortest = fixedMembers.reduce((a, b) => (a.length <= b.length ? a : b))
  const longest = fixedMembers.reduce((a, b) => (a.length >= b.length ? a : b))
  if (longest.length - shortest.length > skew + tolerance) {
    throw new RoutingPhasePreparationError(
      `Length-matched bus "${busName}" has pre-routed members "${shortest.name}" (${shortest.length.toFixed(3)} mm) and "${longest.name}" (${longest.length.toFixed(3)} mm) whose skew exceeds ${skew} mm. Adjust the fixed routes before routing the pending members.`,
    )
  }
  return {
    minLength: Math.max(bounds.minLength ?? 0, longest.length - skew),
    maxLength: Math.min(bounds.maxLength ?? Infinity, shortest.length + skew),
  }
}
