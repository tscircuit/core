import { normalizeDegrees } from "@tscircuit/math-utils"
import { mat4, vec3 } from "gl-matrix"
import type { AssemblyMotor } from "./AssemblyMotor"
import type { AssemblyPlacement } from "./resolve-assembly-placement"

const radians = (degrees: number) => (degrees * Math.PI) / 180
const degrees = (angle: number) => normalizeDegrees((angle * 180) / Math.PI)

/** Shaft alignment in motor-local -> circuit-world CAD XYZ Euler convention:
 * right-handed, +X right, +Y top, +Z above. Angles are degrees, directions
 * never receive translation. Paired with renderAssemblyCadModel's bottom flip.
 */
const shaftRotation = (
  direction: AssemblyMotor["_parsedProps"]["shaftFacingDirection"],
) => {
  switch (direction) {
    case "x+":
      return { x: 0, y: 90, z: 0 }
    case "x-":
      return { x: 0, y: 270, z: 0 }
    case "y+":
      return { x: 270, y: 0, z: 0 }
    case "y-":
      return { x: 90, y: 0, z: 0 }
    default:
      return { x: 0, y: 0, z: 0 }
  }
}

/** Resolve shaft clocking against spec directions, preserving legacy zero-spin
 * placement. Named references aim into the assembly's shaft plane: XY for ±Z,
 * YZ for ±X, ZX for ±Y. Positive angles advance X->Y, Y->Z, Z->X respectively,
 * independent of shaft sign. A mounted board supplies its emitted local +X axis.
 * Numeric angles are right-handed around motor-local +Z before shaft alignment.
 */
export const resolveAssemblyMotorRotation = (
  motor: AssemblyMotor,
  placement: AssemblyPlacement,
) => {
  const alignment = shaftRotation(motor._parsedProps.shaftFacingDirection)
  const input = motor._parsedProps.motorRotation
  if (input === 0) return alignment
  const bottom = placement.layer === "bottom"
  const sign = bottom ? -1 : 1
  // Paired with 3d-viewer getBaseCadRotation and THREE.Euler(..., "XYZ"):
  // intrinsic XYZ is Rx*Ry*Rz (local Z is applied first).
  const orientation = mat4.create()
  mat4.rotateX(orientation, orientation, radians(alignment.x))
  mat4.rotateY(
    orientation,
    orientation,
    radians(alignment.y + (bottom ? 180 : 0)),
  )
  mat4.rotateZ(orientation, orientation, radians(sign * placement.pcbRotation))
  let spin: number
  if (typeof input === "number") spin = radians(input)
  else {
    const expression = input.match(
      /^(?:calc\(\s*)?(wireside|shaftflat)\s*(?:([+-])\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*deg)?\s*\)?$/,
    )!
    const referenceName = expression[1] as "wireside" | "shaftflat"
    const reference = motor.motorReferencePoints[referenceName]
    if (!reference)
      throw new Error(
        `assembly.motor "${motor.name}" has no ${referenceName} reference (a round shaft has no shaftflat)`,
      )
    const targetAngle = radians(
      (expression[2] === "-" ? -1 : 1) * Number(expression[3] ?? 0),
    )
    const axisName = motor._parsedProps.shaftFacingDirection[0]
    const zero: vec3 =
      axisName === "z"
        ? [
            Math.cos(radians(placement.pcbRotation)),
            Math.sin(radians(placement.pcbRotation)),
            0,
          ]
        : axisName === "x"
          ? [0, 1, 0]
          : [0, 0, 1]
    const positiveAxis: vec3 =
      axisName === "z" ? [0, 0, 1] : axisName === "x" ? [1, 0, 0] : [0, 1, 0]
    const quarterTurn = vec3.cross(vec3.create(), positiveAxis, zero)
    const target = vec3.scaleAndAdd(
      vec3.create(),
      vec3.scale(vec3.create(), zero, Math.cos(targetAngle)),
      quarterTurn,
      Math.sin(targetAngle),
    )
    const wireDirection = vec3.transformMat4(
      vec3.create(),
      [reference.direction.x, reference.direction.y, reference.direction.z],
      orientation,
    )
    const shaft = vec3.transformMat4(vec3.create(), [0, 0, 1], orientation)
    spin = Math.atan2(
      vec3.dot(shaft, vec3.cross(vec3.create(), wireDirection, target)),
      vec3.dot(wireDirection, target),
    )
  }
  // Spin about the local shaft before orienting it in the circuit frame.
  mat4.rotateZ(orientation, orientation, spin)
  // Extract intrinsic XYZ, matching THREE.Euler's default order.
  const pitch = Math.asin(Math.max(-1, Math.min(1, orientation[8]!)))
  const nonsingular = Math.abs(orientation[8]!) < 0.999999
  const roll = nonsingular
    ? Math.atan2(-orientation[9]!, orientation[10]!)
    : Math.atan2(orientation[6]!, orientation[5]!)
  const yaw = nonsingular ? Math.atan2(-orientation[4]!, orientation[0]!) : 0
  // Return offsets; renderAssemblyCadModel applies the placement exactly once.
  return {
    x: degrees(roll),
    y: degrees(pitch) - (bottom ? 180 : 0),
    z: sign * degrees(yaw) - placement.pcbRotation,
  }
}
