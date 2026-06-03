import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import { distance, pointToSegmentDistance } from "@tscircuit/math-utils"
import { ConnectivityMap } from "circuit-json-to-connectivity-map"
import type {
  PcbPlatedHole,
  PcbSmtPad,
  PcbTrace,
  SourceTrace,
} from "circuit-json"
import type { SimplifiedPcbTrace } from "lib/utils/autorouting/SimpleRouteJson"

type RoutedTrace = (PcbTrace | SimplifiedPcbTrace) & {
  source_trace_id?: string
}

type RoutePointWithPortIds = {
  route_type: string
  x?: number
  y?: number
  width?: number
  start_pcb_port_id?: string
  end_pcb_port_id?: string
}

const POINT_EPSILON = 1e-6

function isPointOnWireSegment({
  point,
  segmentStart,
  segmentEnd,
}: {
  point: { x: number; y: number; layer?: string }
  segmentStart: { x: number; y: number; layer?: string }
  segmentEnd: { x: number; y: number; layer?: string }
}) {
  if (
    point.layer &&
    (segmentStart.layer !== point.layer || segmentEnd.layer !== point.layer)
  ) {
    return false
  }

  return (
    pointToSegmentDistance(point, segmentStart, segmentEnd) <= POINT_EPSILON
  )
}

function isPointInSmtPad({
  point,
  pad,
  traceWidth = 0,
}: {
  point: { x: number; y: number }
  pad: PcbSmtPad
  traceWidth?: number
}) {
  if (pad.shape === "rect" || pad.shape === "rotated_rect") {
    return (
      Math.abs(point.x - pad.x) <= (pad as any).width / 2 + traceWidth / 2 &&
      Math.abs(point.y - pad.y) <= (pad as any).height / 2 + traceWidth / 2
    )
  }

  if (pad.shape === "circle") {
    return distance(point, pad) <= (pad as any).radius + traceWidth / 2
  }

  return false
}

function isPointInPlatedHole({
  point,
  hole,
  traceWidth = 0,
}: {
  point: { x: number; y: number }
  hole: PcbPlatedHole
  traceWidth?: number
}) {
  return (
    distance(point, hole) <=
    ((hole as any).outer_diameter ?? (hole as any).hole_diameter ?? 0) / 2 +
      traceWidth / 2
  )
}

function getEndpointSourcePortIdsFromGeometry(
  db: CircuitJsonUtilObjects,
  trace: RoutedTrace,
) {
  const sourcePortIds = new Set<string>()
  const route = trace.route as RoutePointWithPortIds[]
  const endpoints = [route[0], route[route.length - 1]].filter(
    (point): point is RoutePointWithPortIds & { x: number; y: number } =>
      Boolean(point) &&
      point.route_type === "wire" &&
      point.x !== undefined &&
      point.y !== undefined,
  )

  for (const endpoint of endpoints) {
    for (const pcbPort of db.pcb_port.list()) {
      if (!pcbPort.source_port_id) continue
      if (distance(endpoint, pcbPort) <= 0.01) {
        sourcePortIds.add(pcbPort.source_port_id)
      }
    }

    for (const smtpad of db.pcb_smtpad.list()) {
      if (!smtpad.pcb_port_id) continue
      if (
        !isPointInSmtPad({
          point: endpoint,
          pad: smtpad,
          traceWidth: endpoint.width,
        })
      )
        continue
      const sourcePortId = db.pcb_port.get(smtpad.pcb_port_id)?.source_port_id
      if (sourcePortId) sourcePortIds.add(sourcePortId)
    }

    for (const hole of db.pcb_plated_hole.list()) {
      if (!hole.pcb_port_id) continue
      if (
        !isPointInPlatedHole({
          point: endpoint,
          hole,
          traceWidth: endpoint.width,
        })
      )
        continue
      const sourcePortId = db.pcb_port.get(hole.pcb_port_id)?.source_port_id
      if (sourcePortId) sourcePortIds.add(sourcePortId)
    }
  }

  return [...sourcePortIds]
}

function getWireRouteEndpoints(trace: RoutedTrace) {
  const route = (trace.route as RoutePointWithPortIds[]).filter(
    (
      point,
    ): point is RoutePointWithPortIds & {
      route_type: "wire"
      x: number
      y: number
      layer?: string
    } =>
      point.route_type === "wire" &&
      point.x !== undefined &&
      point.y !== undefined,
  )

  return [route[0], route[route.length - 1]].filter(
    (point): point is NonNullable<(typeof route)[number]> => Boolean(point),
  )
}

function getSourceIdsFromConnectedPcbTraces(
  db: CircuitJsonUtilObjects,
  trace: RoutedTrace,
) {
  const sourceIds = new Set<string>()
  const endpoints = getWireRouteEndpoints(trace)
  if (endpoints.length === 0) return []

  for (const existingTrace of db.pcb_trace.list()) {
    if (!existingTrace.source_trace_id) continue
    if (existingTrace.pcb_trace_id === trace.pcb_trace_id) continue
    if (
      !db.source_trace.get(existingTrace.source_trace_id) &&
      !db.source_net.get(existingTrace.source_trace_id)
    ) {
      continue
    }

    const existingRoute = existingTrace.route.filter(
      (
        point,
      ): point is Extract<PcbTrace["route"][number], { route_type: "wire" }> =>
        point.route_type === "wire",
    )

    for (let i = 0; i < existingRoute.length - 1; i++) {
      const segmentStart = existingRoute[i]
      const segmentEnd = existingRoute[i + 1]
      if (!segmentStart || !segmentEnd) continue
      for (const endpoint of endpoints) {
        if (
          isPointOnWireSegment({
            point: endpoint,
            segmentStart,
            segmentEnd,
          })
        ) {
          sourceIds.add(existingTrace.source_trace_id)
        }
      }
    }
  }

  return [...sourceIds]
}

function getSourcePortIdsFromRoutedTrace(
  db: CircuitJsonUtilObjects,
  trace: RoutedTrace,
) {
  const sourcePortIds = new Set<string>()

  for (const point of trace.route as RoutePointWithPortIds[]) {
    for (const pcbPortId of [point.start_pcb_port_id, point.end_pcb_port_id]) {
      if (!pcbPortId) continue
      const sourcePortId = db.pcb_port.get(pcbPortId)?.source_port_id
      if (sourcePortId) sourcePortIds.add(sourcePortId)
    }
  }

  if (sourcePortIds.size > 0) return [...sourcePortIds]

  return getEndpointSourcePortIdsFromGeometry(db, trace)
}

function buildSourceConnectivityMap(sourceTraces: SourceTrace[]) {
  const connMap = new ConnectivityMap({})

  connMap.addConnections(
    sourceTraces.map((trace) => [
      trace.source_trace_id,
      ...trace.connected_source_port_ids,
      ...trace.connected_source_net_ids,
    ]),
  )

  return connMap
}

export function getSourceTraceIdForRoutedTrace({
  db,
  trace,
  subcircuit_id,
}: {
  db: CircuitJsonUtilObjects
  trace: RoutedTrace
  subcircuit_id?: string | null
}) {
  if (
    trace.source_trace_id &&
    (db.source_trace.get(trace.source_trace_id) ??
      db.source_net.get(trace.source_trace_id))
  ) {
    return trace.source_trace_id
  }

  const sourcePortIds = getSourcePortIdsFromRoutedTrace(db, trace)
  if (sourcePortIds.length === 0) {
    return getSourceIdsFromConnectedPcbTraces(db, trace)[0]
  }

  const sourceTraces = db.source_trace.list()
  const connMap = buildSourceConnectivityMap(sourceTraces)
  const endpointNetIds = sourcePortIds
    .map((sourcePortId) => connMap.getNetConnectedToId(sourcePortId))
    .filter((netId): netId is string => Boolean(netId))

  const exactSourceTrace =
    sourcePortIds.length >= 2
      ? sourceTraces.find((sourceTrace) =>
          sourcePortIds.every((sourcePortId) =>
            sourceTrace.connected_source_port_ids.includes(sourcePortId),
          ),
        )
      : undefined
  if (exactSourceTrace) return exactSourceTrace.source_trace_id

  const sourceTracesInEndpointNets = sourceTraces.filter((sourceTrace) => {
    const sourceTraceNetId = connMap.getNetConnectedToId(
      sourceTrace.source_trace_id,
    )
    return endpointNetIds.some((netId) => netId === sourceTraceNetId)
  })

  const connectedToEndpoint = sourceTracesInEndpointNets.filter((sourceTrace) =>
    sourceTrace.connected_source_port_ids.some((sourcePortId) =>
      sourcePortIds.includes(sourcePortId),
    ),
  )

  const candidates =
    connectedToEndpoint.length > 0
      ? connectedToEndpoint
      : sourceTracesInEndpointNets
  if (candidates.length === 0) return undefined

  return (
    candidates.find(
      (sourceTrace) => sourceTrace.subcircuit_id === subcircuit_id,
    ) ?? candidates[0]
  )?.source_trace_id
}
