import type {
  SimpleRouteJson as BusLanesInput,
  Trace as BusLanesTrace,
} from "@tscircuit/bus-lanes-solver"
import type {
  Obstacle,
  SimpleRouteConnection,
  SimpleRouteJson,
} from "./SimpleRouteJson"

const GEOMETRY_EPSILON = 1e-8

function isPointInsideObstacle(
  point: { x: number; y: number },
  obstacle: Obstacle,
): boolean {
  const dx = point.x - obstacle.center.x
  const dy = point.y - obstacle.center.y
  if ((obstacle as { shape?: string }).shape === "circle") {
    return Math.hypot(dx, dy) <= obstacle.width / 2 + GEOMETRY_EPSILON
  }
  const angle = -((obstacle.ccwRotationDegrees ?? 0) * Math.PI) / 180
  const localX = dx * Math.cos(angle) - dy * Math.sin(angle)
  const localY = dx * Math.sin(angle) + dy * Math.cos(angle)
  return (
    Math.abs(localX) <= obstacle.width / 2 + GEOMETRY_EPSILON &&
    Math.abs(localY) <= obstacle.height / 2 + GEOMETRY_EPSILON
  )
}

function getTerminalSpanLayers(
  point: SimpleRouteConnection["pointsToConnect"][number],
  connection: SimpleRouteConnection,
  obstacles: Obstacle[],
): string[] | undefined {
  const owners = new Set(
    [
      connection.name,
      connection.source_trace_id,
      connection.rootConnectionName,
      point.pointId,
      point.pcb_port_id,
    ].filter((id): id is string => Boolean(id)),
  )
  const spanLayers: string[] = []
  for (const obstacle of obstacles) {
    if (obstacle.layers.length <= 1) continue
    if (!obstacle.layers.includes(point.layer)) continue
    if (!obstacle.connectedTo.some((id) => owners.has(id))) continue
    if (!isPointInsideObstacle(point, obstacle)) continue
    for (const layer of obstacle.layers) {
      if (!spanLayers.includes(layer)) spanLayers.push(layer)
    }
  }
  return spanLayers.length > 1 ? spanLayers : undefined
}

/** Builds the bus solver's fixed-copper view in board-world millimetres
 * (+X right, +Y up). A through-obstacle passage already conducts between
 * layers through its supplied obstacle; it must not become a new drilled via.
 * Keep its planar projection on the entry layer and split at the layer change.
 * Through-hole terminals also expose every copper layer spanned by their plated
 * hole obstacle so the solver can connect on any spanned layer without an extra
 * surface-transition via. These fragments are input to the solver only, never
 * replacement PCB traces.
 */
export function getBusLanesInputFromSrj(input: SimpleRouteJson): BusLanesInput {
  const traces: BusLanesTrace[] = []
  const occupiedTraceIds = new Set(
    input.traces?.map((trace) => trace.pcb_trace_id),
  )
  for (const trace of input.traces ?? []) {
    let route: BusLanesTrace["route"] = []
    let fragmentIndex = 0
    const flushFragment = (): void => {
      if (!route.length) return
      let pcbTraceId = trace.pcb_trace_id
      if (fragmentIndex > 0) {
        do {
          pcbTraceId = `${trace.pcb_trace_id}_bus_fragment_${fragmentIndex++}`
        } while (occupiedTraceIds.has(pcbTraceId))
      } else {
        fragmentIndex++
      }
      occupiedTraceIds.add(pcbTraceId)
      traces.push({ ...trace, pcb_trace_id: pcbTraceId, route })
      route = []
    }
    for (const segment of trace.route) {
      if (segment.route_type === "jumper") {
        throw new Error(
          "Bus lanes routing does not support supplied jumper copper",
        )
      }
      if (segment.route_type !== "through_obstacle") {
        route.push(segment)
        continue
      }
      route.push(
        {
          route_type: "wire",
          ...segment.start,
          layer: segment.from_layer,
          width: segment.width,
        },
        {
          route_type: "wire",
          ...segment.end,
          layer: segment.from_layer,
          width: segment.width,
        },
      )
      flushFragment()
      route.push({
        route_type: "wire",
        ...segment.end,
        layer: segment.to_layer,
        width: segment.width,
      })
    }
    flushFragment()
  }
  const connections = input.connections.map((connection) => ({
    ...connection,
    pointsToConnect: connection.pointsToConnect.map((point) => {
      const layers = getTerminalSpanLayers(point, connection, input.obstacles)
      return layers ? { ...point, layers } : { ...point }
    }),
  }))
  return { ...input, connections, traces }
}
