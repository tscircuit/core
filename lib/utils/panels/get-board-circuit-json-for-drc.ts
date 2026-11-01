import { su } from "@tscircuit/circuit-json-util"
import type { Board } from "lib/components/normal-components/Board/Board"
import { getDescendantSubcircuitIds } from "lib/utils/autorouting/getAncestorSubcircuitIds"

/** Keep panel connectivity from pulling sibling boards into a board's DRC. */
export const getBoardCircuitJsonForDrc = (board: Board) => {
  const { db } = board.root!
  if (!db.pcb_panel.list().length) {
    return db.subtree({ subcircuit_id: board.subcircuit_id }).toArray()
  }
  const boardSubcircuitIds = new Set([
    board.subcircuit_id!,
    ...getDescendantSubcircuitIds(db, board.subcircuit_id!),
  ])
  const boardCircuitJson = db.toArray().filter((element) => {
    if (element.type === "pcb_panel") return false
    if (element.type === "pcb_board")
      return element.pcb_board_id === board.pcb_board_id
    if ("subcircuit_id" in element && element.subcircuit_id) {
      return boardSubcircuitIds.has(element.subcircuit_id)
    }
    return true
  })
  return su(boardCircuitJson)
    .subtree({ subcircuit_id: board.subcircuit_id })
    .toArray()
}
