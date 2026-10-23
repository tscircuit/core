import type { Point3 } from "circuit-json"
import { vec3 } from "gl-matrix"
import type { BoardDirectionVector } from "lib/utils/pcb/transform-footprint-insertion-direction"
import { inferAssemblyCablePath } from "./infer-assembly-cable-path"

const CONNECTOR_TANGENT_LENGTH_MM = 0.1
const MIN_SEGMENT_LENGTH_MM = 1e-6
const MIN_TANGENT_LENGTH = 1e-10

/** Circuit-world points in mm, right-handed +X right, +Y top, +Z above.
 * Authored vertices are preserved; connector directions are outward unit vectors.
 */
export function resolveAssemblyCablePath({
  cableName,
  from,
  to,
  fromDirection,
  toDirection,
  waypoints,
}: {
  cableName: string
  from: Point3
  to: Point3
  fromDirection: BoardDirectionVector
  toDirection: BoardDirectionVector
  waypoints?: Point3[]
}): Point3[] {
  if (!waypoints?.length) {
    return inferAssemblyCablePath({ from, to, fromDirection, toDirection })
  }
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
        `assembly.cable "${cableName}" waypoints must leave distinct consecutive path points, including connector exits`,
      )
    }
    vec3.normalize(direction, direction)
    if (
      previousDirection &&
      vec3.length(vec3.add(vec3.create(), previousDirection, direction)) <
        MIN_TANGENT_LENGTH
    ) {
      throw new Error(
        `assembly.cable "${cableName}" waypoints must not reverse direction at a path point`,
      )
    }
    previousDirection = direction
  }
  return path
}
