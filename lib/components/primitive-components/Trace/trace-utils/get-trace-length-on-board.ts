import type { PcbTrace } from "circuit-json"
import type { Trace } from "../Trace"
import {
  STANDARD_BOARD_THICKNESS,
  getTraceLength,
} from "./compute-trace-length"

/**
 * Copper length in mm of a route drawn by `trace`. Layer changes are
 * measured through the stackup of the trace's board, or through the board's
 * thickness when it has no stackup.
 */
export function getTraceLengthOnBoard({
  trace,
  route,
}: {
  trace: Trace
  route: PcbTrace["route"]
}): number {
  const { db } = trace.root!
  const pcbBoardId = trace._getBoard()?.pcb_board_id
  if (!pcbBoardId) {
    return getTraceLength({ route, boardThickness: STANDARD_BOARD_THICKNESS })
  }
  return getTraceLength({
    route,
    pcbStackup: db.pcb_stackup.getWhere({ pcb_board_id: pcbBoardId }),
    boardThickness: db.pcb_board.get(pcbBoardId)!.thickness,
  })
}
