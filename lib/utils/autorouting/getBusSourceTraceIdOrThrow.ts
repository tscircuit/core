import type { SourcePort, SourceTrace } from "circuit-json"
import type { Bus } from "lib/components/primitive-components/Bus"
import type { Port } from "lib/components/primitive-components/Port/Port"

type SourcePortId = NonNullable<SourcePort["source_port_id"]>

export const getBusSourceTraceIdOrThrow = ({
  bus,
  busSourceTraces,
  traceNameOrPortSelector,
}: {
  bus: Bus
  busSourceTraces: SourceTrace[]
  traceNameOrPortSelector: string
}): SourceTrace["source_trace_id"] => {
  const sourceTracesWithMatchingName = busSourceTraces.filter(
    (sourceTrace) => sourceTrace.name === traceNameOrPortSelector,
  )
  const selectedPort =
    sourceTracesWithMatchingName.length === 0
      ? bus.getSubcircuit().selectOne<Port>(traceNameOrPortSelector, {
          type: "port",
        })
      : null
  const selectedSourcePortId: SourcePortId | undefined =
    selectedPort?.source_port_id ?? undefined
  const matchingSourceTraces = selectedSourcePortId
    ? busSourceTraces.filter((sourceTrace) =>
        sourceTrace.connected_source_port_ids.includes(selectedSourcePortId),
      )
    : sourceTracesWithMatchingName

  if (matchingSourceTraces.length === 0) {
    throw new Error(
      `Could not find source trace for trace name or port selector "${traceNameOrPortSelector}" in bus "${bus.name}"`,
    )
  }
  if (matchingSourceTraces.length > 1) {
    throw new Error(
      `Trace name or port selector "${traceNameOrPortSelector}" matches multiple source traces in bus "${bus.name}"`,
    )
  }

  const sourceTrace = matchingSourceTraces[0]
  return sourceTrace.source_trace_id
}
