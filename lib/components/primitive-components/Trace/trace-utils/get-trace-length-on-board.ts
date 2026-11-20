import type { PcbTrace } from "circuit-json"
import type { Trace } from "../Trace"
import { getTraceLength } from "./compute-trace-length"

/** Board thickness in mm assumed for a trace that is routed without a board. */
export const STANDARD_BOARD_THICKNESS = 1.6

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
