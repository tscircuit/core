import {
  checkConnectorAccessibleOrientation,
  checkPadPadClearance,
  checkPadTraceClearance,
  checkPcbComponentOverlap,
  checkPcbComponentsOutOfBoard,
  checkViasOffBoard,
} from "@tscircuit/checks"
import type { AnyCircuitElement } from "circuit-json"
import type { Board } from "./Board"

export const Board_doInitialPcbPlacementDesignRuleChecks = (board: Board) => {
  if (board.root?.pcbDisabled) return

  const placementDrcChecksDisabled =
    board.root?.platform?.placementDrcChecksDisabled ??
    board.getInheritedProperty("placementDrcChecksDisabled")
  const drcChecksDisabled =
    board.root?.platform?.drcChecksDisabled ??
    board.getInheritedProperty("drcChecksDisabled")

  board._pcbPlacementDrcErrorCount = 0
  if (placementDrcChecksDisabled || drcChecksDisabled) return

  const { db } = board.root!
  const existingPlacementErrorCount = db.pcb_placement_error.list().length
  const subcircuitCircuitJson = db
    .subtree({ subcircuit_id: board.subcircuit_id })
    .toArray()

  try {
    const placementCheckResults = [
      ...checkViasOffBoard(subcircuitCircuitJson),
      ...checkPcbComponentsOutOfBoard(subcircuitCircuitJson),
      ...checkPcbComponentOverlap(subcircuitCircuitJson),
      ...checkPadPadClearance(subcircuitCircuitJson),
      ...checkPadTraceClearance(subcircuitCircuitJson),
      ...checkConnectorAccessibleOrientation(subcircuitCircuitJson),
    ]
    db.insertAll(placementCheckResults as AnyCircuitElement[])
    board._pcbPlacementDrcErrorCount =
      existingPlacementErrorCount +
      placementCheckResults.filter((result) => result.type.endsWith("_error"))
        .length
  } catch {
    // Some imported footprint polygons cannot be evaluated by placement DRC.
    // Leave routing enabled and let the normal post-routing DRC report it.
    board._pcbPlacementDrcErrorCount = existingPlacementErrorCount
  }
}
