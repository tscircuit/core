import type { PcbTraceId } from "lib/utils/circuit-json/circuit-json-id-types"
import type { SimpleRouteJson, SimplifiedPcbTrace } from "./SimpleRouteJson"

/** Select new untimed bus copper; undefined also locks earlier output in this phase. */
export function getRenegotiableBusTraceIds({
  input,
  traces,
  fixedTraceIds,
  isAutomaticBusOutput,
}: {
  input: SimpleRouteJson
  traces: SimplifiedPcbTrace[]
  fixedTraceIds: ReadonlySet<PcbTraceId>
  isAutomaticBusOutput: boolean
}): ReadonlySet<PcbTraceId> | undefined {
  const hasTimingConstraints =
    Boolean(input.differentialPairs?.length) ||
    (input.buses ?? []).some(
      (bus) =>
        bus.minLength !== undefined ||
        bus.maxLength !== undefined ||
        bus.maxLengthSkew !== undefined,
    )
  if (!isAutomaticBusOutput || hasTimingConstraints) return undefined

  const renegotiableBusTraceIds = new Set<PcbTraceId>()

  for (const trace of traces) {
    if (
      !fixedTraceIds.has(trace.pcb_trace_id) &&
      trace.connectsTo?.length === 2 &&
      trace.allowedLayers !== undefined
    ) {
      renegotiableBusTraceIds.add(trace.pcb_trace_id)
    }
  }
  return renegotiableBusTraceIds
}
