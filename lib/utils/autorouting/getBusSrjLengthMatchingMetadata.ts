import type {
  SourceBusLengthMatchingPath,
  SourcePort,
  SourceTrace,
} from "circuit-json"
import type { Bus } from "lib/components/primitive-components/Bus"
import { getBusSrjConnectionNamesOrThrow } from "./getBusSrjConnectionNamesOrThrow"
import type {
  SimpleRouteBus,
  SimpleRouteConnection,
  SimplifiedPcbTrace,
  SrjConnectionName,
} from "./SimpleRouteJson"

type SourcePortId = SourcePort["source_port_id"]
type SrjTimingEndpoint = SimpleRouteConnection["pointsToConnect"][number]
type BusLengthMatchingMetadata = Pick<
  SimpleRouteBus,
  "skewReference" | "referenceConnectionNames" | "lengthMatchingPaths"
>

function shareSourceTraceGroup(
  sourceTrace: SourceTrace,
  otherSourceTrace: SourceTrace,
): boolean {
  if (sourceTrace === otherSourceTrace) return true
  return (
    sourceTrace.subcircuit_connectivity_map_key !== undefined &&
    sourceTrace.subcircuit_connectivity_map_key ===
      otherSourceTrace.subcircuit_connectivity_map_key
  )
}

function getFixedReferencePath({
  bus,
  sourceTrace,
  busSourceTraces,
  lengthMatchingPaths,
}: {
  bus: Bus
  sourceTrace: SourceTrace
  busSourceTraces: SourceTrace[]
  lengthMatchingPaths: SourceBusLengthMatchingPath[]
}): SourceBusLengthMatchingPath | undefined {
  for (const path of lengthMatchingPaths) {
    const pathSourceTrace = busSourceTraces.find(
      (candidate) => candidate.source_trace_id === path.source_trace_id,
    )!
    if (shareSourceTraceGroup(sourceTrace, pathSourceTrace)) return
  }

  const sourcePortIds = new Set<SourcePortId>()
  for (const candidate of busSourceTraces) {
    if (!shareSourceTraceGroup(sourceTrace, candidate)) continue
    for (const sourcePortId of candidate.connected_source_port_ids)
      sourcePortIds.add(sourcePortId)
  }
  const ports = [...sourcePortIds]
  if (ports.length !== 2)
    throw new Error(
      `Bus "${bus.name}" needs lengthMatchingPaths for a branched timing reference`,
    )
  return {
    source_trace_id: sourceTrace.source_trace_id,
    source_port_ids: [ports[0], ports[1]],
  }
}

/** Board-world points in mm, right-handed: +X right, +Y up, +Z toward top. */
function getTimingEndpoint({
  bus,
  sourcePortId,
}: {
  bus: Bus
  sourcePortId: SourcePortId
}): SrjTimingEndpoint {
  const pcbPort = bus.root!.db.pcb_port.getWhere({
    source_port_id: sourcePortId,
  })
  if (!pcbPort?.layers.length)
    throw new Error(`Bus "${bus.name}" timing path has no PCB port`)
  return {
    x: pcbPort.x,
    y: pcbPort.y,
    layer: pcbPort.layers[0],
    pcb_port_id: pcbPort.pcb_port_id,
  }
}

/** Project already resolved source constraints onto pending and fixed copper. */
export function getBusSrjLengthMatchingMetadata({
  bus,
  srjConnections,
  fixedTraces,
  busSourceTraces,
}: {
  bus: Bus
  srjConnections: SimpleRouteConnection[]
  fixedTraces: SimplifiedPcbTrace[]
  busSourceTraces: SourceTrace[]
}): BusLengthMatchingMetadata {
  if (!bus.source_bus_id) return {}
  const sourceBus = bus.root!.db.source_bus.get(bus.source_bus_id)!
  const srjTiming: BusLengthMatchingMetadata = {}
  if (sourceBus.skew_reference !== undefined)
    srjTiming.skewReference = sourceBus.skew_reference

  const activeConnectionNames = new Set(
    srjConnections.map((connection) => connection.name),
  )
  const referenceConnectionNames = new Set<SrjConnectionName>()
  const lengthMatchingPaths = [...(sourceBus.length_matching_paths ?? [])]
  for (const sourceTraceId of sourceBus.length_match_source_trace_ids ?? []) {
    const connectionNames = getBusSrjConnectionNamesOrThrow({
      bus,
      srjConnections,
      fixedTraces,
      busSourceTraces,
      sourceTraceId,
      traceNameOrPortSelector: "lengthMatchTo",
    })
    for (const connectionName of connectionNames)
      referenceConnectionNames.add(connectionName)
    if (connectionNames.some((name) => activeConnectionNames.has(name)))
      continue

    const sourceTrace = busSourceTraces.find(
      (trace) => trace.source_trace_id === sourceTraceId,
    )!
    const referencePath = getFixedReferencePath({
      bus,
      sourceTrace,
      busSourceTraces,
      lengthMatchingPaths,
    })
    if (referencePath) lengthMatchingPaths.push(referencePath)
  }
  if (referenceConnectionNames.size)
    srjTiming.referenceConnectionNames = [...referenceConnectionNames]

  for (const path of lengthMatchingPaths) {
    const connectionNames = getBusSrjConnectionNamesOrThrow({
      bus,
      srjConnections,
      fixedTraces,
      busSourceTraces,
      sourceTraceId: path.source_trace_id,
      traceNameOrPortSelector: "lengthMatchingPaths",
    })
    if (connectionNames.length !== 1)
      throw new Error(
        `Bus "${bus.name}" timing path must resolve to one electrical routing connection`,
      )
    const from = getTimingEndpoint({
      bus,
      sourcePortId: path.source_port_ids[0],
    })
    const to = getTimingEndpoint({ bus, sourcePortId: path.source_port_ids[1] })
    srjTiming.lengthMatchingPaths ??= []
    srjTiming.lengthMatchingPaths.push({
      connectionName: connectionNames[0],
      pcbPortIds: [from.pcb_port_id!, to.pcb_port_id!],
      from,
      to,
    })
  }
  return srjTiming
}
