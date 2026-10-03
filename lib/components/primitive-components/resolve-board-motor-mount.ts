import type { Board } from "../normal-components/Board/Board"
import type { AssemblyMotor } from "./AssemblyMotor"

import { getComponentsInAssemblyScope } from "./get-assembly-scope-components"
export { getComponentsInAssemblyScope } from "./get-assembly-scope-components"
import {
  boardMountsToPrintedPart,
  resolvePrintedPartMounts,
} from "./resolve-printed-part-mounts"

export const resolveBoardMotorMount = (
  board: Board,
): AssemblyMotor | undefined => {
  if (boardMountsToPrintedPart(board)) {
    resolvePrintedPartMounts(board)
    return
  }
  const { mountedTo } = board._parsedProps
  if (!mountedTo) return
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
      motor.componentName === "AssemblyMotor" && motor.name === motorName,
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
  return motor
}
