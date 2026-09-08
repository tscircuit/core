import { runAllPlacementChecks } from "@tscircuit/checks"
import type { AnyCircuitElement } from "circuit-json"
import type { Renderable } from "../base-components/Renderable"
import type { Board } from "./Board"

/**
 * Physical dimensions that must be greater than zero, per element type.
 *
 * A negative or zero size is silently accepted today: `<hole diameter="-2mm" />`
 * produces `hole_diameter: -2` with no error, and a `<board width="0mm" />`
 * renders an empty board. Nothing downstream rejects it, so the mistake only
 * surfaces as a confusing render or an unmanufacturable export.
 */
const POSITIVE_DIMENSION_FIELDS: Record<string, string[]> = {
  pcb_board: ["width", "height"],
  pcb_hole: ["hole_diameter", "hole_width", "hole_height"],
  pcb_plated_hole: [
    "hole_diameter",
    "outer_diameter",
    "hole_width",
    "hole_height",
    "outer_width",
    "outer_height",
    "rect_pad_width",
    "rect_pad_height",
  ],
  pcb_via: ["hole_diameter", "outer_diameter"],
  pcb_smtpad: ["width", "height", "radius"],
}

const reportNonPositiveDimensions = ({
  board,
  elements,
}: {
  board: Board
  elements: AnyCircuitElement[]
}) => {
  const { db } = board.root!

  for (const element of elements as any[]) {
    const fields = POSITIVE_DIMENSION_FIELDS[element.type]
    if (!fields) continue

    for (const field of fields) {
      const value = element[field]
      if (typeof value !== "number" || Number.isNaN(value)) continue
      if (value > 0) continue

      const label =
        element.name ?? element[`${element.type}_id`] ?? element.type
      db.pcb_placement_error.insert({
        error_type: "pcb_placement_error",
        message: `${element.type} "${label}" has ${field}=${value}mm, which must be greater than zero.`,
        subcircuit_id: board.subcircuit_id ?? undefined,
      })
    }
  }
}

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

  const { db } = board.root!
  const subcircuitCircuitJson = db
    .subtree({ subcircuit_id: board.subcircuit_id })
    .toArray()
  reportNonPositiveDimensions({
    board,
    elements: subcircuitCircuitJson,
  })

  if (placementDrcChecksDisabled || drcChecksDisabled) {
    board._pcbPlacementDrcErrorCount = 0
    return
  }

  const existingPlacementDiagnostics = db.toArray()

  board._pcbPlacementDrcChecksPending = true
  board._queueAsyncEffect("board:pre-route-placement-checks", async () => {
    try {
      const placementCheckResults = await runAllPlacementChecks(
        subcircuitCircuitJson,
      )
      const relevantPlacementCheckResults = placementCheckResults.filter(
        (result) => !board._isExpectedCastellatedHoleDrcError(result),
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
