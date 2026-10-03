import { normalizeDegrees } from "@tscircuit/math-utils"
import { mat4, vec3 } from "gl-matrix"
import type { AssemblyMotor } from "./AssemblyMotor"
import type { AssemblyPlacement } from "./resolve-assembly-placement"
import {
  matchesAssemblyIdentity,
  resolveMotorMountedBoard,
} from "./resolve-board-motor-mount"
import { resolveBoardMountRotationAnchor } from "./resolve-board-mount-rotation-anchor"

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

/** Motor-local -> circuit-world directions, right-handed +Z above.
 * Board-owned alignment clocks the motor relative to finalized PCB geometry.
 * Angles are degrees; clockwise is viewed looking at the mounting face.
 */
export const resolveAssemblyMotorRotation = (
  motor: AssemblyMotor,
  placement: AssemblyPlacement,
) => {
  const alignment = shaftRotation(motor._parsedProps.shaftFacingDirection)
  const board = resolveMotorMountedBoard(motor)
  const input = board?._parsedProps.mountRotation
  if (!board || !input) return alignment
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
  const expression = input.startsWith("calc(")
    ? input.match(
        /^calc\(\s*(.*?)\s*(?:([+-])\s*((?:\d+(?:\.\d*)?|\.\d+))\s*(degcw|degccw))?\s*\)$/,
      )!
    : [input, input]
  const path = expression[1]!
  const separator = path.lastIndexOf(".")
  const motorIdentity = path.slice(0, separator)
  const directionName = path.slice(separator + 1)
  if (!matchesAssemblyIdentity(motor, motorIdentity))
    throw new Error(
      `board "${board.name}" mountRotation "${input}" must reference its mounted motor "${motor.name}"`,
    )
  const direction = Object.entries(motor.motorReferencePoints).find(
    ([name]) => name === directionName,
  )?.[1]
  if (!direction)
    throw new Error(
      `assembly.motor "${motor.name}" has no ${directionName} reference`,
    )
  if (Math.abs(direction.direction.z) > 1e-6)
    throw new Error(
      `board "${board.name}" mountRotation "${input}" must reference a direction in the mounting face, e.g. "${motorIdentity}.wireside"`,
    )
  const clockwiseAngle = radians(
    (expression[2] === "-" ? -1 : 1) *
      Number(expression[3] ?? 0) *
      (expression[4] === "degccw" ? -1 : 1),
  )
  const anchor = vec3.normalize(
    vec3.create(),
    resolveBoardMountRotationAnchor(board),
  )
  const shaft = vec3.transformMat4(vec3.create(), [0, 0, 1], orientation)
  // Backface normal is -shaft: clockwise looking at it is positive about shaft.
  const turn = mat4.fromRotation(mat4.create(), -clockwiseAngle, shaft)
  const target = vec3.transformMat4(vec3.create(), anchor, turn)
  const motorDirection = vec3.transformMat4(
    vec3.create(),
    [direction.direction.x, direction.direction.y, direction.direction.z],
    orientation,
  )
  const spin = Math.atan2(
    vec3.dot(shaft, vec3.cross(vec3.create(), motorDirection, target)),
    vec3.dot(motorDirection, target),
  )
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
