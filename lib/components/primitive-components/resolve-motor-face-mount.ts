import { normalizeDegrees } from "@tscircuit/math-utils"
import type { AssemblyMotor } from "./AssemblyMotor"
import { getComponentsInAssemblyScope } from "./get-assembly-scope-components"
import { resolvePrintedPartMounts } from "./resolve-printed-part-mounts"

/** Motor-local to circuit-world rigid placement, right-handed +X right, +Y top,
 * +Z above. Position is a point in mm; rotation orients directions in degrees
 * using CAD's intrinsic XYZ (Rx*Ry*Rz), as in resolveAssemblyMotorRotation.
 */
export const resolveMotorFaceMount = (motor: AssemblyMotor) => {
  if (
    !getComponentsInAssemblyScope(motor).some(
      (part) =>
        part.componentName === "AssemblyMotor" &&
        (part as AssemblyMotor)._parsedProps.mountedTo,
    )
  )
    return
  const { transforms, roots, motorMountRoots, subcircuitId } =
    resolvePrintedPartMounts(motor)
  if (!motorMountRoots.has(roots.get(motor)!)) return
  const world = transforms.get(motor)!
  const pitch = Math.asin(Math.max(-1, Math.min(1, world[8])))
  const nonsingular = Math.abs(world[8]) < 0.999999
  const roll = nonsingular
    ? Math.atan2(-world[9], world[10])
    : Math.atan2(world[6], world[5])
  const yaw = nonsingular ? Math.atan2(-world[4], world[0]) : 0
  const degrees = (angle: number) => normalizeDegrees((angle * 180) / Math.PI)
  return {
    position: { x: world[12], y: world[13], z: world[14] },
    rotation: { x: degrees(roll), y: degrees(pitch), z: degrees(yaw) },
    subcircuit_id: subcircuitId,
  }
}
