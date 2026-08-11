import type { EnclosureFace } from "@tscircuit/create-fdm-enclosure"
import type { BoardWall } from "./get-nearest-board-wall"

/**
 * Board edges and enclosure side faces are named for the same axes, so a board
 * wall is already an enclosure face. This is a typed identity rather than a
 * mapping, and it is deliberately not a lookup table: core once swapped the +Y
 * and -Y walls here to compensate for a renderer bug, and the coordinate-frame
 * RFC requires that core never contain such a flip again. With no table there
 * is nowhere for one to reappear.
 *
 * The assignment below is the assertion: if the two vocabularies ever diverge,
 * this stops compiling.
 */
export const getSolverWall = (boardWall: BoardWall): EnclosureFace => {
  const face: EnclosureFace = boardWall
  return face
}
