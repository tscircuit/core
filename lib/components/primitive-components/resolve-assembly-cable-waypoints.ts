import type { Point3 } from "circuit-json"
import { applyToPoint } from "transformation-matrix"
import type { AssemblyCable } from "./AssemblyCable"
import type { AssemblyCableEndpoint } from "./resolve-assembly-cable-endpoint"

export function resolveAssemblyCableWaypoints({
  cable,
  from,
  to,
}: {
  cable: AssemblyCable
  from: AssemblyCableEndpoint
  to: AssemblyCableEndpoint
}): Point3[] | undefined {
  const { waypoints, waypointAnchor, waypointAxisOrientation } =
    cable._parsedProps
  if (!waypoints?.length) return waypoints
  let anchor = from.position
  if (waypointAnchor === "end") anchor = to.position
  let board = from.board
  if (waypointAxisOrientation === "board_at_end") board = to.board
  if (!board) {
    let endpoint = cable._parsedProps.from
    if (waypointAxisOrientation === "board_at_end")
      endpoint = cable._parsedProps.to
    throw new Error(
      `assembly.cable "${cable.name}" endpoint "${endpoint}" has no board for waypointAxisOrientation="${waypointAxisOrientation}"`,
    )
  }
  // Paired with board placement in _computePcbGlobalTransformBeforeLayout;
  // offsets are directions, so board translation does not apply.
  const boardToWorld = {
    ...board._computePcbGlobalTransformBeforeLayout(),
    e: 0,
    f: 0,
  }
  return waypoints.map((waypoint) => {
    const offset = applyToPoint(boardToWorld, waypoint)
    return {
      x: anchor.x + offset.x,
      y: anchor.y + offset.y,
      z: anchor.z + waypoint.z,
    }
  })
}
