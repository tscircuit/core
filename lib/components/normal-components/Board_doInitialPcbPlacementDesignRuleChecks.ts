import { runAllPlacementChecks } from "@tscircuit/checks"
import type { AnyCircuitElement } from "circuit-json"
import type { Renderable } from "../base-components/Renderable"
import type { Board } from "./Board"
import { getPcbPortNotMatchedErrors } from "./board-get-pcb-port-not-matched-errors"

const resetPcbTraceRenderInSubtree = (renderable: Renderable) => {
  if (renderable._pcbTraceRenderWaitingForPlacementChecks) {
    renderable.renderPhaseStates.PcbTraceRender.initialized = false
    renderable.renderPhaseStates.PcbTraceRender.dirty = false
    renderable._pcbTraceRenderWaitingForPlacementChecks = false
  }
  for (const child of renderable.children) {
    resetPcbTraceRenderInSubtree(child as Renderable)
  }
}

export const Board_doInitialPcbPlacementDesignRuleChecks = (board: Board) => {
  if (board.root?.pcbDisabled) return

  const placementDrcChecksDisabled =
    board.root?.platform?.placementDrcChecksDisabled ??
    board.getInheritedProperty("placementDrcChecksDisabled")
  const drcChecksDisabled =
    board.root?.platform?.drcChecksDisabled ??
    board.getInheritedProperty("drcChecksDisabled")

  board._pcbPlacementDrcErrorCount = null
  board._pcbPlacementDrcCheckError = null
  board._pcbPlacementDrcChecksPending = false
  if (placementDrcChecksDisabled || drcChecksDisabled) {
    board._pcbPlacementDrcErrorCount = 0
    return
  }

  const { db } = board.root!
  const subcircuitCircuitJson = db
    .subtree({ subcircuit_id: board.subcircuit_id })
    .toArray()
  const existingPlacementDiagnostics = db.toArray()

  board._pcbPlacementDrcChecksPending = true
  board._queueAsyncEffect("board:pre-route-placement-checks", async () => {
    try {
      const placementCheckResults = [
        ...getPcbPortNotMatchedErrors(subcircuitCircuitJson),
        ...(await runAllPlacementChecks(subcircuitCircuitJson)),
      ]
      const newPlacementDiagnostics = placementCheckResults.filter(
        (result) =>
          !existingPlacementDiagnostics.some(
            (existing) =>
              existing.type === result.type &&
              "message" in existing &&
              existing.message === result.message,
          ),
      )

      db.insertAll(newPlacementDiagnostics as AnyCircuitElement[])
      board._pcbPlacementDrcErrorCount = placementCheckResults.filter(
        (result) => result.type.endsWith("_error"),
      ).length
    } catch (error) {
      board._pcbPlacementDrcCheckError =
        error instanceof Error ? error.message : String(error)
    } finally {
      board._pcbPlacementDrcChecksPending = false
      resetPcbTraceRenderInSubtree(board)
    }
  })
}
