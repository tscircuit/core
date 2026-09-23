import type { CadFoldContext } from "@tscircuit/flex-utils"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"

/** Get the board fold and the component's flat PCB mount in Circuit JSON
 * world coordinates (right-handed, +Z above, mm). Returns undefined on a flat
 * board. CAD positions are points; the fold also projects rotation directions.
 */
export function getBoardFoldContext(
  pcbComponentOwner: PrimitiveComponent,
): CadFoldContext | undefined {
  const board = pcbComponentOwner._getBoard()
  if (
    !board?.pcbFold ||
    !board.pcb_board_id ||
    !pcbComponentOwner.pcb_component_id
  )
    return undefined

  const { db } = pcbComponentOwner.root!
  const pcbBoard = db.pcb_board.get(board.pcb_board_id)!
  const pcbComponent = db.pcb_component.get(pcbComponentOwner.pcb_component_id)!
  return {
    fold: board.pcbFold,
    boardCenter: pcbBoard.center,
    flatMount: pcbComponent.center,
  }
}
