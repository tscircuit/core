import type { Matrix4, Vector3D } from "jscad-planner"

/** Rigid local-to-world frame to radians in Rz * Ry * Rx order, matching
 * JSCAD and CAD Euler rotations. Translation is ignored.
 */
export const getAssemblyEulerAngles = (transform: Matrix4): Vector3D => {
  const y = Math.asin(Math.max(-1, Math.min(1, -transform[2])))
  const angles =
    Math.abs(Math.cos(y)) > 1e-8
      ? [
          Math.atan2(transform[6], transform[10]),
          y,
          Math.atan2(transform[1], transform[0]),
        ]
      : [0, y, Math.atan2(-transform[4], transform[5])]
  return angles.map((angle) => (angle === 0 ? 0 : angle)) as Vector3D
}
