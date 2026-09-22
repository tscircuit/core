import type { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { compose, translate } from "transformation-matrix"

/** Map local PCB points to flat board-center-relative points in mm, in the
 * right-handed Circuit JSON frame (+X right, +Y top, +Z above the PCB).
 * Rotation/translation are baked into geometry; group IDs convey ownership only.
 */
export function getPcbFlexBoardTransform(primitive: PrimitiveComponent) {
  const boardId = primitive._getBoard()?.pcb_board_id
  const board = boardId ? primitive.root!.db.pcb_board.get(boardId) : null
  if (!board)
    throw new Error(`${primitive.componentName} must be inside a board`)
  // Same authored parent/local transform used by PcbNoteLine and Cutout.
  const transform = compose(
    translate(-board.center.x, -board.center.y),
    primitive._computePcbGlobalTransformBeforeLayout(),
  )
  return { board, transform }
}
