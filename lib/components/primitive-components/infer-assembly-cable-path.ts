import { vec3 } from "gl-matrix"
import type { Point3 } from "circuit-json"
import type { BoardDirectionVector } from "lib/utils/pcb/transform-footprint-insertion-direction"

/** Resolve a smooth initial cable route in right-handed circuit world, mm
 * (+X right, +Y top, +Z above). Endpoint points are wire exits; directions point
 * away from their mating connectors. This simple route supplies endpoint
 * clearance and a smooth arch, without obstacle avoidance or a gravity solver.
 */
export function inferAssemblyCablePath({
  from,
  to,
  fromDirection,
  toDirection,
}: {
  from: Point3
  to: Point3
  fromDirection: BoardDirectionVector
  toDirection: BoardDirectionVector
}): Point3[] {
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
