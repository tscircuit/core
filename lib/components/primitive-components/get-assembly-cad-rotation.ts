import { normalizeDegrees } from "@tscircuit/math-utils"
import type { Point3 } from "circuit-json"
import type { Matrix4 } from "jscad-planner"

/** Rigid owner-local to circuit-world frame, right-handed +X right, +Y top,
 * +Z above; translation is ignored. Return degrees in CAD's Rx * Ry * Rz
 * order, paired with circuit-json-to-gltf's rotateVector/rotationFromAxes and
 * resolveAssemblyMotorRotation. JSCAD operation angles use a different order.
 */
export const getAssemblyCadRotation = (world: Matrix4): Point3 => {
  const pitch = Math.asin(Math.max(-1, Math.min(1, world[8])))
  const regular = Math.abs(world[8]) < 0.999999
  const roll = regular
    ? Math.atan2(-world[9], world[10])
    : Math.atan2(world[6], world[5])
  const yaw = regular ? Math.atan2(-world[4], world[0]) : 0
  const degrees = (angle: number) => normalizeDegrees((angle * 180) / Math.PI)
  return { x: degrees(roll), y: degrees(pitch), z: degrees(yaw) }
}
