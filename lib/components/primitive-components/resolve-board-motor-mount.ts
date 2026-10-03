import type { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import type { Board } from "../normal-components/Board/Board"
import type { AssemblyMotor } from "./AssemblyMotor"

import { getComponentsInAssemblyScope } from "./get-assembly-scope-components"
export { getComponentsInAssemblyScope } from "./get-assembly-scope-components"
import { boardMountsToPrintedPart, resolvePrintedPartMounts } from "./resolve-printed-part-mounts"

export const matchesAssemblyIdentity = (
  component: PrimitiveComponent,
  path: string,
) => {
  const names = path.split(".")
  let ancestor: PrimitiveComponent | null = component
  for (const name of names.reverse()) {
    if (!ancestor || ancestor.name !== name) return false
    ancestor = ancestor.parent
  }
  return true
}

export const resolveBoardMotorMount = (
  board: Board,
): AssemblyMotor | undefined => {
  if (boardMountsToPrintedPart(board)) {
    resolvePrintedPartMounts(board)
    return
  }
  const { mountedTo, mountRotation, mountRotationAnchor, mountOrientation } =
    board._parsedProps
  if (!mountedTo) {
    if (mountRotation || mountRotationAnchor || mountOrientation)
      throw new Error(
        `board "${board.name}" mounting alignment requires mountedTo`,
      )
    return
  }
  const separator = mountedTo.lastIndexOf(".")
  const motorName = mountedTo.slice(0, separator)
  const face = mountedTo.slice(separator + 1)
  if (separator < 1 || face !== "backface") {
    throw new Error(
      `board "${board.name}" mountedTo "${mountedTo}" must name a motor backface, e.g. "NEMA17.backface"`,
    )
  }
  const motors = getComponentsInAssemblyScope(board).filter(
    (motor): motor is AssemblyMotor =>
      motor.componentName === "AssemblyMotor" &&
      matchesAssemblyIdentity(motor, motorName),
  )
  if (motors.length !== 1) {
    throw new Error(
      `board "${board.name}" mountedTo "${mountedTo}" matched ${motors.length} motors; expected exactly one in the assembly device`,
    )
  }
  const motor = motors[0]!
  const direction = motor._parsedProps.shaftFacingDirection
  if (direction !== "z+" && direction !== "z-") {
    throw new Error(
      `board "${board.name}" cannot mount to motor "${motorName}" facing ${direction}: rotated PCB boards are not yet supported; use shaftFacingDirection="z+" or "z-"`,
    )
  }
  if (mountRotationAnchor && !mountRotation)
    throw new Error(
      `board "${board.name}" mountRotationAnchor requires mountRotation`,
    )
  if (motor.props.shaftFacingDirection && mountOrientation) {
    const expected =
      direction === "z+"
        ? "top_layer_toward_mount_face"
        : "bottom_layer_toward_mount_face"
    if (mountOrientation !== expected)
      throw new Error(
        `board "${board.name}" mountOrientation "${mountOrientation}" conflicts with motor "${motorName}" shaftFacingDirection "${direction}"`,
      )
  }
  return motor
}

export const resolveMotorMountedBoard = (motor: AssemblyMotor) => {
  const boards = getComponentsInAssemblyScope(motor)
    .filter((board): board is Board => board.componentName === "Board")
    .filter((board) => resolveBoardMotorMount(board) === motor)
  if (boards.length > 1)
    throw new Error(
      `assembly.motor "${motor.name}" has multiple mounted boards; only one board may determine its placement`,
    )
  return boards[0]
}
