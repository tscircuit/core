import type {
  Obstacle,
  SimpleRouteConnection,
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import type { RoutingPhasePlan } from "./GroupRoutingPhasePlan"

type RoutePoint = SimplifiedPcbTrace["route"][number]

function isWirePoint(
  point: RoutePoint,
): point is Extract<RoutePoint, { route_type: "wire" }> {
  return point.route_type === "wire"
}

function isViaPoint(
  point: RoutePoint,
): point is Extract<RoutePoint, { route_type: "via" }> {
  return point.route_type === "via"
}

function isJumperPoint(
  point: RoutePoint,
): point is Extract<RoutePoint, { route_type: "jumper" }> {
  return point.route_type === "jumper"
}

function getTraceConnectionName(trace: SimplifiedPcbTrace): string {
  return trace.connection_name ?? trace.pcb_trace_id
}

function getWireWidth(start: RoutePoint, end: RoutePoint): number {
  if (isWirePoint(start)) return start.width
  if (isWirePoint(end)) return end.width
  return 0.1
}

function getSegmentLayer(start: RoutePoint, end: RoutePoint): string | null {
  if (isWirePoint(start)) return start.layer
  if (isWirePoint(end)) return end.layer
  if (isJumperPoint(start)) return start.layer
  if (isJumperPoint(end)) return end.layer
  return null
}

function getRoutePointX(point: RoutePoint): number | null {
  if (isJumperPoint(point)) return null
  return point.x
}

function getRoutePointY(point: RoutePoint): number | null {
  if (isJumperPoint(point)) return null
  return point.y
}

function createWireObstacle(
  start: RoutePoint,
  end: RoutePoint,
  connectedTo: string,
  obstacleIndex: number,
): Obstacle | null {
  const startX = getRoutePointX(start)
  const startY = getRoutePointY(start)
  const endX = getRoutePointX(end)
  const endY = getRoutePointY(end)
  const layer = getSegmentLayer(start, end)
  if (startX === null || startY === null) return null
  if (endX === null || endY === null) return null
  if (!layer) return null

  const width = getWireWidth(start, end)
  const dx = Math.abs(startX - endX)
  const dy = Math.abs(startY - endY)

  return {
    obstacleId: `${connectedTo}_phase_obstacle_${obstacleIndex}`,
    type: "rect",
    layers: [layer],
    center: {
      x: (startX + endX) / 2,
      y: (startY + endY) / 2,
    },
    width: dx + width,
    height: dy + width,
    connectedTo: [connectedTo],
  }
}

function createJumperObstacle(
  point: Extract<RoutePoint, { route_type: "jumper" }>,
  connectedTo: string,
  obstacleIndex: number,
): Obstacle {
  const dx = Math.abs(point.start.x - point.end.x)
  const dy = Math.abs(point.start.y - point.end.y)
  const width = 0.6

  return {
    obstacleId: `${connectedTo}_phase_jumper_obstacle_${obstacleIndex}`,
    type: "rect",
    layers: [point.layer],
    center: {
      x: (point.start.x + point.end.x) / 2,
      y: (point.start.y + point.end.y) / 2,
    },
    width: dx + width,
    height: dy + width,
    connectedTo: [connectedTo],
  }
}

function createViaObstacle(
  point: Extract<RoutePoint, { route_type: "via" }>,
  connectedTo: string,
  obstacleIndex: number,
  defaultViaDiameter: number,
): Obstacle {
  return {
    obstacleId: `${connectedTo}_phase_via_obstacle_${obstacleIndex}`,
    type: "rect",
    layers: [point.from_layer, point.to_layer],
    center: { x: point.x, y: point.y },
    width: point.via_diameter ?? defaultViaDiameter,
    height: point.via_diameter ?? defaultViaDiameter,
    connectedTo: [connectedTo],
  }
}

function addTraceObstacles(
  obstacles: Obstacle[],
  trace: SimplifiedPcbTrace,
  defaultViaDiameter: number,
): void {
  const connectedTo = getTraceConnectionName(trace)

  for (let routeIndex = 0; routeIndex < trace.route.length; routeIndex++) {
    const routePoint = trace.route[routeIndex]
    if (isViaPoint(routePoint)) {
      obstacles.push(
        createViaObstacle(
          routePoint,
          connectedTo,
          routeIndex,
          defaultViaDiameter,
        ),
      )
    } else if (isJumperPoint(routePoint)) {
      obstacles.push(createJumperObstacle(routePoint, connectedTo, routeIndex))
    }

    if (routeIndex === trace.route.length - 1) continue
    const nextPoint = trace.route[routeIndex + 1]
    const obstacle = createWireObstacle(
      routePoint,
      nextPoint,
      connectedTo,
      routeIndex,
    )
    if (obstacle) obstacles.push(obstacle)
  }
}

function connectionIsInRoutingPhase(
  connection: SimpleRouteConnection,
  phasePlan: RoutingPhasePlan,
): boolean {
  for (const trace of phasePlan.traces) {
    if (!trace.source_trace_id) continue
    if (connection.source_trace_id === trace.source_trace_id) return true
    if (connection.name === trace.source_trace_id) return true
  }

  for (const net of phasePlan.nets) {
    if (!net.source_net_id) continue
    if (connection.name === net.source_net_id) return true
  }

  return false
}

export function Group_hasPhasedAutorouting(
  routingPhasePlans: RoutingPhasePlan[],
): boolean {
  for (const plan of routingPhasePlans) {
    if (plan.routingPhaseIndex !== null) return true
  }
  return false
}

export function Group_filterSimpleRouteJsonForPhase(
  simpleRouteJson: SimpleRouteJson,
  phasePlan: RoutingPhasePlan,
): SimpleRouteJson {
  const connections: SimpleRouteConnection[] = []
  for (const connection of simpleRouteJson.connections) {
    if (connectionIsInRoutingPhase(connection, phasePlan)) {
      connections.push(connection)
    }
  }

  return {
    ...simpleRouteJson,
    connections,
  }
}

export function Group_getObstaclesFromRoutedTraces(
  traces: SimplifiedPcbTrace[],
  defaultViaDiameter = 0.6,
): Obstacle[] {
  const obstacles: Obstacle[] = []
  for (const trace of traces) {
    addTraceObstacles(obstacles, trace, defaultViaDiameter)
  }
  return obstacles
}
