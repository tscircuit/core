import type { Board } from "../normal-components/Board/Board"
import type { AssemblyMotor } from "./AssemblyMotor"
import type { AssemblyPlacement } from "./resolve-assembly-placement"
import { normalizeDegrees } from "@tscircuit/math-utils"
import {
  getComponentsInAssemblyScope,
  resolveBoardMotorMount,
} from "./resolve-board-motor-mount"

/** Motor origin point in right-handed circuit world, mm (+X right, +Y top,
 * +Z above). Boards keep their PCB plane at Z=0. Mounting translates the motor
 * so its rear face is mountGap from the nearest PCB surface; modelprinter's
 * rear face is local Z=-bodyLength. Read finalized PCB geometry, independently
 * of CAD render order, so forward references and board anchors work.
 */
export const resolveAssemblyMotorPlacement = (
  motor: AssemblyMotor,
): AssemblyPlacement => {
  const boards = getComponentsInAssemblyScope(motor)
    .filter((board): board is Board => board.componentName === "Board")
    .filter((board) => resolveBoardMotorMount(board) === motor)
  if (boards.length > 1) {
    throw new Error(
      `assembly.motor "${motor.name}" has multiple mounted boards; only one board may determine its placement`,
    )
  }
  const board = boards[0]
  const layer =
    motor._parsedProps.shaftFacingDirection === "z-" ? "bottom" : "top"
  if (!board) return { position: { x: 0, y: 0, z: 0 }, pcbRotation: 0, layer }
  const pcbBoard = board.root!.db.pcb_board.get(board.pcb_board_id!)
  if (!pcbBoard)
    throw new Error(`Mounted board "${board.name}" has no PCB geometry`)
  const sign = motor._parsedProps.shaftFacingDirection === "z-" ? -1 : 1
  // Paired with PrimitiveComponent._computePcbGlobalTransformBeforeLayout,
  // which places the board's holes. Extract its local +X direction rather
  // than re-deriving a rotation from authored props or ignoring parent frames.
  const boardTransform = board._computePcbGlobalTransformBeforeLayout()
  return {
    position: {
      ...pcbBoard.center,
      z:
        sign *
        (motor.motorModel.bodyLength +
          (board._parsedProps.mountGap ?? 0) +
          pcbBoard.thickness / 2),
    },
    pcbRotation: normalizeDegrees(
      (Math.atan2(boardTransform.b, boardTransform.a) * 180) / Math.PI,
    ),
    layer,
    subcircuit_id: pcbBoard.subcircuit_id,
  }
}
