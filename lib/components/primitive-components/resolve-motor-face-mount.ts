import type { AssemblyMotor } from "./AssemblyMotor"
import { getComponentsInAssemblyScope } from "./get-assembly-scope-components"
import { resolvePrintedPartMounts } from "./resolve-printed-part-mounts"
import { findParentAssembly } from "./resolve-assembly-placement"
import { getAssemblyCadRotation } from "./get-assembly-cad-rotation"

/** Motor-local to circuit-world rigid placement, right-handed +X right, +Y top,
 * +Z above. Position is a point in mm; rotation orients directions in degrees
 * using CAD's intrinsic XYZ (Rx*Ry*Rz), as in resolveAssemblyMotorRotation.
 */
export const resolveMotorFaceMount = (motor: AssemblyMotor) => {
  const parent = findParentAssembly(motor)
  if (
    !parent &&
    !getComponentsInAssemblyScope(motor).some(
      (part) =>
        part.componentName === "AssemblyMotor" &&
        (part as AssemblyMotor)._parsedProps.mountedTo,
    )
  )
    return
  const { transforms, roots, motorMountRoots, subcircuitId } =
    resolvePrintedPartMounts(motor)
  if (!parent && !motorMountRoots.has(roots.get(motor)!)) return
  const world = transforms.get(motor)!
  return {
    position: { x: world[12], y: world[13], z: world[14] },
    rotation: getAssemblyCadRotation(world),
    subcircuit_id: subcircuitId,
  }
}
