import type { SourceBusRouteLength, SourceTrace } from "circuit-json"
import type { Bus } from "lib/components/primitive-components/Bus"
import { getBusSourceTraceIdOrThrow } from "./getBusSourceTraceIdOrThrow"

export const getSourceBusTargetLength = ({
  bus,
  busSourceTraces,
}: {
  bus: Bus
  busSourceTraces: SourceTrace[]
}): SourceBusRouteLength | undefined => {
  const targetLength = bus._parsedProps.targetLength
  if (targetLength === undefined || typeof targetLength === "number") {
    return targetLength
  }
  return {
    reference: targetLength.reference,
    offset: targetLength.offset,
    source_trace_ids: targetLength.of?.map((traceNameOrPortSelector) =>
      getBusSourceTraceIdOrThrow({
        bus,
        busSourceTraces,
        traceNameOrPortSelector,
      }),
    ),
  }
}
