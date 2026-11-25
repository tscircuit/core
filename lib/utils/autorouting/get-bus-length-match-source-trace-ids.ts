import type { SourceTrace } from "circuit-json"
import { Bus } from "lib/components/primitive-components/Bus"
import { DifferentialPair } from "lib/components/primitive-components/DifferentialPair"
import { getBusSourceTraceIdOrThrow } from "./getBusSourceTraceIdOrThrow"

/** Resolve the existing trace, port, bus and pair lengthMatchTo selectors. */
export function getBusLengthMatchSourceTraceIds({
  bus,
  busSourceTraces,
}: {
  bus: Bus
  busSourceTraces: SourceTrace[]
}): SourceTrace["source_trace_id"][] | undefined {
  const lengthMatchTo = bus._parsedProps.lengthMatchTo
  if (lengthMatchTo === undefined) return undefined
  const selectors =
    typeof lengthMatchTo === "string" ? [lengthMatchTo] : lengthMatchTo
  const subcircuit = bus.getSubcircuit()
  const selectedSourceTraceIds = selectors.flatMap((selector) => {
    let traceSelectors = [selector]
    if (!busSourceTraces.some((trace) => trace.name === selector)) {
      const selectedGroup =
        subcircuit
          .selectAll<Bus | DifferentialPair>("bus, differentialpair")
          .find((group) => group.name === selector) ??
        subcircuit.selectOne<Bus | DifferentialPair>(selector)
      if (selectedGroup instanceof Bus) {
        traceSelectors = selectedGroup._parsedProps.connections
      } else if (selectedGroup instanceof DifferentialPair) {
        traceSelectors = [
          selectedGroup._parsedProps.positiveConnection,
          selectedGroup._parsedProps.negativeConnection,
        ]
      }
    }
    return traceSelectors.map((traceNameOrPortSelector) =>
      getBusSourceTraceIdOrThrow({
        bus,
        busSourceTraces,
        traceNameOrPortSelector,
      }),
    )
  })
  return [...new Set(selectedSourceTraceIds)]
}
