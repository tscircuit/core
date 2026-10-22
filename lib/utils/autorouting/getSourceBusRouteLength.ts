import type { SourceBusRouteLength, SourceTrace } from "circuit-json"
import type { Bus } from "lib/components/primitive-components/Bus"
import { getBusSourceTraceIdOrThrow } from "./getBusSourceTraceIdOrThrow"

export const getSourceBusRouteLength = ({
  bus,
  busSourceTraces,
  property,
}: {
  bus: Bus
  busSourceTraces: SourceTrace[]
  property: "minLength" | "maxLength" | "targetLength"
}): SourceBusRouteLength | undefined => {
  const routeLength = bus._parsedProps[property]
  if (routeLength === undefined || typeof routeLength === "number") {
    return routeLength
  }
  return {
    reference: routeLength.reference,
    offset: routeLength.offset,
    source_trace_ids: routeLength.of?.map((traceNameOrPortSelector) =>
      getBusSourceTraceIdOrThrow({
        bus,
        busSourceTraces,
        traceNameOrPortSelector,
      }),
    ),
  }
}
