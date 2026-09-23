import { transformCadPose, type CadPose } from "@tscircuit/flex-utils"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"

/** Resolve a flat CAD pose to the containing board's assembled pose.
 * Positions are right-handed Circuit JSON world points in mm (+Z above);
 * rotations are intrinsic XYZ degrees. The PCB mount remains in flat world XY.
 */
export function resolveBoardCadPose(
  component: PrimitiveComponent,
  flatPose: CadPose,
): CadPose {
  const board = component._getBoard()
  if (!board?.pcbFold || !board.pcb_board_id || !component.pcb_component_id)
    return flatPose

  const { db } = component.root!
  const pcbBoard = db.pcb_board.get(board.pcb_board_id)!
  const pcbComponent = db.pcb_component.get(component.pcb_component_id)!
  return transformCadPose(
    flatPose,
    {
      fold: board.pcbFold,
      boardCenter: pcbBoard.center,
      flatMount: pcbComponent.center,
    },
    true,
  )
}
