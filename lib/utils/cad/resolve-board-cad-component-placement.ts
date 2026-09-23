import {
  transformCadComponentPlacement,
  type CadComponentPlacement,
} from "@tscircuit/flex-utils"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"

/** Resolve a flat CAD component placement to the containing board's assembled placement.
 * Positions are right-handed Circuit JSON world points in mm (+Z above);
 * rotations are intrinsic XYZ degrees. The PCB mount remains in flat world XY.
 */
export function resolveBoardCadComponentPlacement(
  component: PrimitiveComponent,
  flatCadComponentPlacement: CadComponentPlacement,
): CadComponentPlacement {
  const board = component._getBoard()
  if (!board?.pcbFold || !board.pcb_board_id || !component.pcb_component_id)
    return flatCadComponentPlacement

  const { db } = component.root!
  const pcbBoard = db.pcb_board.get(board.pcb_board_id)!
  const pcbComponent = db.pcb_component.get(component.pcb_component_id)!
  return transformCadComponentPlacement(
    { cadComponentPlacement: flatCadComponentPlacement, foldPcbs: true },
    {
      fold: board.pcbFold,
      boardCenter: pcbBoard.center,
      flatMount: pcbComponent.center,
    },
  )
}
