import { getBoardCircuitJsonForDrc } from "lib/utils/panels/get-board-circuit-json-for-drc"
import {
  consolidatePcbOverlapErrors,
  runAllPlacementChecks,
} from "@tscircuit/checks"
import type { AnyCircuitElement } from "circuit-json"
import type { Renderable } from "../../base-components/Renderable"
import type { Board } from "./Board"

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
  const subcircuitCircuitJson = getBoardCircuitJsonForDrc(board)
  const existingPlacementDiagnostics = db.toArray()

  board._pcbPlacementDrcChecksPending = true
  board._queueAsyncEffect("board:pre-route-placement-checks", async () => {
    try {
      const placementCheckResults = await runAllPlacementChecks(
        subcircuitCircuitJson,
        { consolidateOverlaps: false },
      )
      const isSameComponentCutoutError = (result: AnyCircuitElement) => {
        const candidate = result as Record<string, unknown>
        const cutoutId =
          typeof candidate.pcb_cutout_id === "string"
            ? candidate.pcb_cutout_id
            : Array.isArray(candidate.pcb_cutout_ids) &&
                typeof candidate.pcb_cutout_ids[0] === "string"
              ? candidate.pcb_cutout_ids[0]
              : undefined
        const cutout = cutoutId
          ? subcircuitCircuitJson.find(
              (el) =>
                el.type === "pcb_cutout" &&
                (el as { pcb_cutout_id?: string }).pcb_cutout_id === cutoutId,
            )
          : undefined
        const cutoutComponentId = (
          cutout as { pcb_component_id?: string } | undefined
        )?.pcb_component_id
        if (!cutoutComponentId) {
          if (
            typeof candidate.message === "string" &&
            candidate.message.toLowerCase().includes("cutout")
          ) {
            const compIds = Array.isArray(candidate.pcb_component_ids)
              ? candidate.pcb_component_ids.filter(
                  (id): id is string => typeof id === "string",
                )
              : []
            if (compIds.length > 0 && new Set(compIds).size === 1) return true
          }
          return false
        }
        const padIds = [
          ...(typeof candidate.pcb_smtpad_id === "string"
            ? [candidate.pcb_smtpad_id]
            : []),
          ...(Array.isArray(candidate.pcb_smtpad_ids)
            ? candidate.pcb_smtpad_ids
            : []),
          ...(typeof candidate.pcb_plated_hole_id === "string"
            ? [candidate.pcb_plated_hole_id]
            : []),
          ...(Array.isArray(candidate.pcb_plated_hole_ids)
            ? candidate.pcb_plated_hole_ids
            : []),
        ].filter((id): id is string => typeof id === "string")
        if (padIds.length === 0) return false
        return padIds.every((id) => {
          const el = subcircuitCircuitJson.find(
            (item) =>
              (item.type === "pcb_smtpad" && item.pcb_smtpad_id === id) ||
              (item.type === "pcb_plated_hole" &&
                item.pcb_plated_hole_id === id),
          ) as { pcb_component_id?: string } | undefined
          return el?.pcb_component_id === cutoutComponentId
        })
      }
      const relevantPlacementCheckResults = consolidatePcbOverlapErrors(
        subcircuitCircuitJson,
        placementCheckResults.filter(
          (result) =>
            !board._isExpectedCastellatedHoleDrcError(result) &&
            !isSameComponentCutoutError(result),
        ),
      )
      const newPlacementDiagnostics = relevantPlacementCheckResults.filter(
        (result) =>
          !existingPlacementDiagnostics.some(
            (existing) =>
              existing.type === result.type &&
              "message" in existing &&
              existing.message === result.message,
          ),
      )

      db.insertAll(newPlacementDiagnostics as AnyCircuitElement[])
      board._pcbPlacementDrcErrorCount = relevantPlacementCheckResults.filter(
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
