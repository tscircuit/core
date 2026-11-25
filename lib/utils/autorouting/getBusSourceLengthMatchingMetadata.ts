import type { SourceBus, SourceTrace } from "circuit-json"
import { Bus } from "lib/components/primitive-components/Bus"
import type { DifferentialPair } from "lib/components/primitive-components/DifferentialPair"
import type { Port } from "lib/components/primitive-components/Port/Port"
import { getBusSourceTraceIdOrThrow } from "./getBusSourceTraceIdOrThrow"

type ReferenceGroup = Bus | DifferentialPair

function resolveLengthReference({
  bus,
  sourceTraces,
  selector,
  visited,
}: {
  bus: Bus
  sourceTraces: SourceTrace[]
  selector: string
  visited: ReadonlySet<ReferenceGroup>
}): SourceTrace["source_trace_id"][] {
  if (sourceTraces.some((trace) => trace.name === selector)) {
    return [
      getBusSourceTraceIdOrThrow({
        bus,
        busSourceTraces: sourceTraces,
        traceNameOrPortSelector: selector,
      }),
    ]
  }
  const group = bus.getSubcircuit().selectOne<ReferenceGroup>(selector)
  if (
    group &&
    ["Bus", "DifferentialPair"].includes(group.config.componentName)
  ) {
    if (visited.has(group))
      throw new Error(`Bus "${bus.name}" has a circular length reference`)
    const next = new Set(visited).add(group)
    let selectors: string[]
    if (group instanceof Bus) selectors = group._parsedProps.connections
    else
      selectors = [
        group._parsedProps.positiveConnection,
        group._parsedProps.negativeConnection,
      ]
    return selectors.flatMap((member) =>
      resolveLengthReference({
        bus,
        sourceTraces,
        selector: member,
        visited: next,
      }),
    )
  }
  return [
    getBusSourceTraceIdOrThrow({
      bus,
      busSourceTraces: sourceTraces,
      traceNameOrPortSelector: selector,
    }),
  ]
}

/** Resolve explicit source endpoints without inferring a path through a branch. */
export function getBusSourceLengthMatchingMetadata({
  bus,
  sourceTraces,
}: {
  bus: Bus
  sourceTraces: SourceTrace[]
}): Pick<
  SourceBus,
  "skew_reference" | "length_match_source_trace_ids" | "length_matching_paths"
> {
  const paths: NonNullable<SourceBus["length_matching_paths"]> = []
  for (const [fromSelector, toSelector] of bus._parsedProps
    .lengthMatchingPaths ?? []) {
    const from = bus
      .getSubcircuit()
      .selectOne<Port>(fromSelector, { type: "port" })
    const to = bus.getSubcircuit().selectOne<Port>(toSelector, { type: "port" })
    if (!from?.source_port_id || !to?.source_port_id || from === to) {
      throw new Error(
        `Bus "${bus.name}" needs two distinct timing-path ports: "${fromSelector}", "${toSelector}"`,
      )
    }
    const first = sourceTraces.find((trace) =>
      trace.connected_source_port_ids.includes(from.source_port_id!),
    )
    const second = sourceTraces.find((trace) =>
      trace.connected_source_port_ids.includes(to.source_port_id!),
    )
    if (!first || !second)
      throw new Error(
        `Bus "${bus.name}" timing-path ports need connected traces`,
      )
    const sameNet =
      first === second ||
      (first.subcircuit_connectivity_map_key !== undefined &&
        first.subcircuit_connectivity_map_key ===
          second.subcircuit_connectivity_map_key) ||
      first.connected_source_net_ids?.some((netId) =>
        second.connected_source_net_ids?.includes(netId),
      )
    if (!sameNet) {
      throw new Error(
        `Bus "${bus.name}" timing-path ports "${fromSelector}" and "${toSelector}" belong to different nets`,
      )
    }
    paths.push({
      source_trace_id: first.source_trace_id,
      source_port_ids: [from.source_port_id, to.source_port_id],
    })
  }
  const metadata: Pick<
    SourceBus,
    "skew_reference" | "length_match_source_trace_ids" | "length_matching_paths"
  > = {}
  if (bus._parsedProps.skewReference !== undefined)
    metadata.skew_reference = bus._parsedProps.skewReference
  if (paths.length) metadata.length_matching_paths = paths
  let selectors = bus._parsedProps.lengthMatchTo ?? []
  if (typeof selectors === "string") selectors = [selectors]
  if (selectors.length) {
    metadata.length_match_source_trace_ids = [
      ...new Set(
        selectors.flatMap((selector) =>
          resolveLengthReference({
            bus,
            sourceTraces,
            selector,
            visited: new Set([bus]),
          }),
        ),
      ),
    ]
  }
  return metadata
}
