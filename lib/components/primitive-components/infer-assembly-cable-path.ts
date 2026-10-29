import { vec3 } from "gl-matrix"
import type { Point3 } from "circuit-json"
import type { BoardDirectionVector } from "lib/utils/pcb/transform-footprint-insertion-direction"

const CONNECTOR_TANGENT_LENGTH_MM = 0.1
const MIN_SEGMENT_LENGTH_MM = 1e-6
const MIN_TANGENT_LENGTH = 1e-10

/** Resolve an authored or initial cable route in right-handed circuit world, mm
 * (+X right, +Y top, +Z above). Endpoint points are wire exits; directions point
 * away from their mating connectors. This simple route supplies endpoint
 * clearance and a smooth arch when waypoints are omitted or empty.
 */
export function inferAssemblyCablePath({
  from,
  to,
  fromDirection,
  toDirection,
  waypoints,
  cableName,
}: {
  from: Point3
  to: Point3
  fromDirection: BoardDirectionVector
  toDirection: BoardDirectionVector
  /** Authored circuit-world points, in mm, between the wire exits. */
  waypoints?: Point3[]
  cableName?: string
}): Point3[] {
  if (waypoints?.length) {
    const fromTangent = vec3.scaleAndAdd(
      vec3.create(),
      [from.x, from.y, from.z],
      [fromDirection.x, fromDirection.y, fromDirection.z],
      CONNECTOR_TANGENT_LENGTH_MM,
    )
    const toTangent = vec3.scaleAndAdd(
      vec3.create(),
      [to.x, to.y, to.z],
      [toDirection.x, toDirection.y, toDirection.z],
      CONNECTOR_TANGENT_LENGTH_MM,
    )
    const path = [
      from,
      { x: fromTangent[0], y: fromTangent[1], z: fromTangent[2] },
      ...waypoints.map((point) => ({ ...point })),
      { x: toTangent[0], y: toTangent[1], z: toTangent[2] },
      to,
    ]
    let previousDirection: vec3 | undefined
    for (let vertex = 1; vertex < path.length; vertex++) {
      const previous = path[vertex - 1]!
      const current = path[vertex]!
      const direction = vec3.subtract(
        vec3.create(),
        [current.x, current.y, current.z],
        [previous.x, previous.y, previous.z],
      )
      if (vec3.length(direction) < MIN_SEGMENT_LENGTH_MM) {
        throw new Error(
          `assembly.cable "${cableName ?? "unnamed cable"}" waypoints must leave distinct consecutive path points, including connector exits`,
        )
      }
      vec3.normalize(direction, direction)
      if (
        previousDirection &&
        vec3.length(vec3.add(vec3.create(), previousDirection, direction)) <
          MIN_TANGENT_LENGTH
      ) {
        throw new Error(
          `assembly.cable "${cableName ?? "unnamed cable"}" waypoints must not reverse direction at a path point`,
        )
      }
      previousDirection = direction
    }
    return path
  }
  const distance = Math.hypot(to.x - from.x, to.y - from.y, to.z - from.z)
  if (distance < 1e-6)
    throw new Error("Cable wire exits must be at different positions")
  const chord = vec3.fromValues(to.x - from.x, to.y - from.y, to.z - from.z)
  const routeNormal = vec3.cross(vec3.create(), chord, [
    fromDirection.x,
    fromDirection.y,
    fromDirection.z,
  ])
  if (vec3.length(routeNormal) < 1e-6) {
    vec3.cross(
      routeNormal,
      chord,
      Math.abs(chord[2]!) / distance > 0.95 ? [0, 1, 0] : [0, 0, 1],
    )
  }
  const archDirection = vec3.normalize(
    vec3.create(),
    vec3.cross(vec3.create(), routeNormal, chord),
  )
  // Prefer clearance below the board when both exits are below its Z=0 plane.
  const archSide = from.z < 0 && to.z < 0 ? -1 : 1
  if (archDirection[2]! * archSide < 0)
    vec3.scale(archDirection, archDirection, -1)
  const clearance = Math.min(25, Math.max(8, distance / 3))
  const controlA = {
    x: from.x + fromDirection.x * clearance,
    y: from.y + fromDirection.y * clearance,
    z: from.z + fromDirection.z * clearance,
  }
  const controlB = {
    x: to.x + toDirection.x * clearance,
    y: to.y + toDirection.y * clearance,
    z: to.z + toDirection.z * clearance,
  }
  const path: Point3[] = [
    from,
    {
      x: from.x + fromDirection.x * 0.1,
      y: from.y + fromDirection.y * 0.1,
      z: from.z + fromDirection.z * 0.1,
    },
  ]
  for (let i = 1; i < 48; i++) {
    const t = i / 48,
      u = 1 - t
    // Zero endpoint derivative keeps the connector tangents fixed. The arch
    // also avoids a reversing tangent when connectors face away from each other.
    const arch = Math.sin(Math.PI * t) ** 2 * Math.min(12, distance * 0.15)
    path.push({
      x:
        u ** 3 * from.x +
        3 * u ** 2 * t * controlA.x +
        3 * u * t ** 2 * controlB.x +
        t ** 3 * to.x +
        archDirection[0]! * arch,
      y:
        u ** 3 * from.y +
        3 * u ** 2 * t * controlA.y +
        3 * u * t ** 2 * controlB.y +
        t ** 3 * to.y +
        archDirection[1]! * arch,
      z:
        u ** 3 * from.z +
        3 * u ** 2 * t * controlA.z +
        3 * u * t ** 2 * controlB.z +
        t ** 3 * to.z +
        archDirection[2]! * arch,
    })
  }
  path.push(
    {
      x: to.x + toDirection.x * 0.1,
      y: to.y + toDirection.y * 0.1,
      z: to.z + toDirection.z * 0.1,
    },
    to,
  )
  return path
}
