import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { PcbTrace } from "circuit-json"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

const POINT_TOLERANCE = 1e-6

const isPointInsideObstacle = (
  point: { x: number; y: number },
  obstacle: SimpleRouteJson["obstacles"][number],
) => {
  if (obstacle.shape === "circle") {
    return (
      Math.hypot(point.x - obstacle.center.x, point.y - obstacle.center.y) <=
      Math.min(obstacle.width, obstacle.height) / 2 + POINT_TOLERANCE
    )
  }

  return (
    Math.abs(point.x - obstacle.center.x) <=
      obstacle.width / 2 + POINT_TOLERANCE &&
    Math.abs(point.y - obstacle.center.y) <=
      obstacle.height / 2 + POINT_TOLERANCE
  )
}

export const claimSrjAssignablePcbViasTraversedByRoute = ({
  db,
  inputSimpleRouteJson,
  pcbTrace,
}: {
  db: CircuitJsonUtilObjects
  inputSimpleRouteJson?: SimpleRouteJson
  pcbTrace: PcbTrace
}) => {
  if (!inputSimpleRouteJson) return

  const traversedPads = pcbTrace.route.filter(
    (
      routePoint,
    ): routePoint is Extract<
      PcbTrace["route"][number],
      { route_type: "through_pad" }
    > => routePoint.route_type === "through_pad",
  )

  for (const traversedPad of traversedPads) {
    const assignableObstacle = inputSimpleRouteJson.obstacles.find(
      (obstacle) =>
        obstacle.netIsAssignable &&
        obstacle.layers.includes(traversedPad.start_layer) &&
        obstacle.layers.includes(traversedPad.end_layer) &&
        isPointInsideObstacle(traversedPad.start, obstacle) &&
        isPointInsideObstacle(traversedPad.end, obstacle),
    )
    if (!assignableObstacle) continue

    const assignablePcbVia = assignableObstacle.connectedTo
      .map((connectedId) => db.pcb_via.get(connectedId))
      .find(
        (pcbVia) =>
          pcbVia?.net_is_assignable &&
          (!pcbVia.net_assigned ||
            pcbVia.pcb_trace_id === pcbTrace.pcb_trace_id),
      )
    if (!assignablePcbVia) continue

    db.pcb_via.update(assignablePcbVia.pcb_via_id, {
      pcb_trace_id: pcbTrace.pcb_trace_id,
      net_assigned: true,
    })
  }
}
