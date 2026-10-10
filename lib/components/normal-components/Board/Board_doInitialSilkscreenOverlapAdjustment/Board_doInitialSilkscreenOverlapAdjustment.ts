import { SilkscreenLabelPlacementSolver } from "lib/utils/silkscreen-label-placement/SilkscreenLabelPlacementSolver"
import type { SilkscreenLabelLayer } from "lib/utils/silkscreen-label-placement/types"
import type { Board } from "../Board"
import { getSilkscreenLabelPlacementSolverParams } from "./getSilkscreenLabelPlacementSolverParams"

const SILKSCREEN_LABEL_LAYERS: SilkscreenLabelLayer[] = ["top", "bottom"]

const placeSilkscreenLabels = (board: Board, layer: SilkscreenLabelLayer) => {
  const root = board.root!
  const params = getSilkscreenLabelPlacementSolverParams(board, layer)
  const paramsJson = JSON.stringify(params)
  // Placement is deterministic, so the same inputs are placed, or fail, once
  if (paramsJson === board._silkscreenLabelPlacementParamsJsonByLayer[layer])
    return
  board._silkscreenLabelPlacementParamsJsonByLayer[layer] = paramsJson

  const solver = new SilkscreenLabelPlacementSolver(params)
  // Setup marks the solver solved when no label has an issue
  solver.setup()
  if (solver.solved) return

  const solverConstructorArgs = solver.getConstructorParams()
  root.emit("solver:started", {
    type: "solver:started",
    solverName: "SilkscreenLabelPlacementSolver",
    solverParams: solverConstructorArgs[0],
    solverConstructorArgs,
    componentName: board.getString(),
  })
  try {
    solver.solve()
  } finally {
    root.emit("solver:ended", {
      type: "solver:ended",
      solverName: "SilkscreenLabelPlacementSolver",
      componentName: board.getString(),
      solved: solver.solved,
      failed: solver.failed,
      iterations: solver.iterations,
      error: solver.error,
    })
  }

  const placements = solver.getOutput()
  for (const placement of placements) {
    root.db.pcb_silkscreen_text.update(placement.pcbSilkscreenTextId, {
      anchor_position: placement.anchorPosition,
      anchor_alignment: "center",
      ccw_rotation: placement.ccwRotation,
    })
  }
  if (placements.length > 0)
    board._silkscreenLabelPlacementParamsJsonByLayer[layer] = JSON.stringify(
      getSilkscreenLabelPlacementSolverParams(board, layer),
    )
}

/**
 * Moves the labels of the board's parts, their footprints' reference
 * designators and the labels written on them, off pads, holes, silkscreen,
 * other text and each other, one side at a time.
 * Labels are cosmetic, so an error leaves a side's labels where they are and
 * is reported without failing the render. Updates that change none of a
 * side's inputs, like routing, don't run its solver again.
 * A board rendered in an isolated subcircuit render is placed once inflated
 * into the root circuit.
 */
export const Board_doInitialSilkscreenOverlapAdjustment = (board: Board) => {
  const { root } = board
  if (!root?.isRootCircuit || root.pcbDisabled || !board.pcb_board_id) return
  for (const layer of SILKSCREEN_LABEL_LAYERS) {
    try {
      placeSilkscreenLabels(board, layer)
    } catch (error) {
      const cause = error instanceof Error ? error.message : String(error)
      root.db.source_runtime_error.insert({
        error_type: "source_runtime_error",
        phase_name: "SilkscreenOverlapAdjustment",
        message: `Silkscreen labels on the ${layer} side of ${board.getString()} could not be placed: ${cause}`,
      })
    }
  }
}
