import {
  type Bounds,
  doBoundsOverlap,
  getBoundFromCenteredRect,
  getBoundsFromPoints,
} from "@tscircuit/math-utils"
import type { PcbComponent, Point } from "circuit-json"
import {
  getBoardPlacedSilkscreenLabels,
  getSilkscreenLabelPlacingBoard,
  isPcbPart,
} from "lib/components/base-components/NormalComponent/utils/getBoardPlacedSilkscreenLabels"
import type {
  PcbComponentId,
  PcbSilkscreenTextId,
} from "lib/utils/circuit-json/circuit-json-id-types"
import { getPcbBoardOutlinePolygon } from "lib/utils/get-pcb-board-outline-polygon"
import {
  getBoundsUnion,
  getTextBounds,
} from "lib/utils/silkscreen-label-placement/label-geometry"
import type {
  MovableSilkscreenLabel,
  SilkscreenLabelLayer,
  SilkscreenLabelPart,
  SilkscreenLabelPlacementSolverParams,
} from "lib/utils/silkscreen-label-placement/types"
import type { Board } from "../Board"
import { getSilkscreenLabelObstacles } from "./getSilkscreenLabelObstacles"

const getBoardOutline = (board: Board): Point[] | null => {
  const pcbBoard = board.root!.db.pcb_board.get(board.pcb_board_id!)
  if (!pcbBoard) return null
  if (
    !pcbBoard.outline?.length &&
    (pcbBoard.width === undefined || pcbBoard.height === undefined)
  )
    return null
  const boardOutline = getPcbBoardOutlinePolygon(pcbBoard).vertices.map(
    ({ x, y }) => ({ x, y }),
  )
  return boardOutline.length >= 3 ? boardOutline : null
}

/**
 * Collects one side of the board: its parts, obstacles and the labels returned
 * by getBoardPlacedSilkscreenLabels, or null when no label on that side can
 * move. Parts of nested subcircuits are included, parts on a mounted board are
 * not.
 */
export const getSilkscreenLabelPlacementSolverParams = (
  board: Board,
  layer: SilkscreenLabelLayer,
): SilkscreenLabelPlacementSolverParams | null => {
  const { db } = board.root!
  const boardDescendants = board.getDescendants()
  const boardNormalComponents = boardDescendants
    .filter(isPcbPart)
    .filter(
      (normalComponent) =>
        getSilkscreenLabelPlacingBoard(normalComponent) === board,
    )
  const boardPcbComponentIds = new Set<PcbComponentId>(
    boardNormalComponents.map(
      (normalComponent) => normalComponent.pcb_component_id!,
    ),
  )
  // Board-level elements belong to the board's subcircuit or a nested one
  const boardSubcircuitIds = new Set(
    [board, ...boardDescendants]
      .filter(
        (component) =>
          component.isSubcircuit && component._getBoard() === board,
      )
      .map((component) => component.getSubcircuit().subcircuit_id),
  )

  const pcbComponents: PcbComponent[] = []
  const nameByPcbComponentId = new Map<PcbComponentId, string>()
  const labels: MovableSilkscreenLabel[] = []
  for (const normalComponent of boardNormalComponents) {
    const pcbComponent = db.pcb_component.get(normalComponent.pcb_component_id!)
    if (!pcbComponent || pcbComponent.layer !== layer) continue
    pcbComponents.push(pcbComponent)
    nameByPcbComponentId.set(
      pcbComponent.pcb_component_id,
      normalComponent.name,
    )

    for (const pcbSilkscreenText of getBoardPlacedSilkscreenLabels(
      normalComponent,
      layer,
    )) {
      labels.push({
        pcbSilkscreenTextId: pcbSilkscreenText.pcb_silkscreen_text_id,
        pcbComponentId: pcbComponent.pcb_component_id,
        text: pcbSilkscreenText.text,
        fontSize: pcbSilkscreenText.font_size,
        isKnockout: pcbSilkscreenText.is_knockout,
        knockoutPadding: pcbSilkscreenText.knockout_padding,
        currentBounds: getTextBounds(pcbSilkscreenText),
        currentCcwRotation: pcbSilkscreenText.ccw_rotation ?? 0,
      })
    }
  }

  // Obstacles are only collected for a side with labels to place
  if (labels.length === 0) return null

  const boardOutline = getBoardOutline(board)
  const boardBounds = boardOutline && getBoundsFromPoints(boardOutline)
  const movablePcbSilkscreenTextIds = new Set<PcbSilkscreenTextId>(
    labels.map((label) => label.pcbSilkscreenTextId),
  )
  const obstacles = getSilkscreenLabelObstacles({
    db,
    layer,
    pcbBoardId: board.pcb_board_id!,
    getPcbComponentIdOnBoard: ({ pcb_component_id, subcircuit_id }, bounds) => {
      if (pcb_component_id && boardPcbComponentIds.has(pcb_component_id))
        return pcb_component_id
      // The board's own text, like its project name, carries the board's id
      if (pcb_component_id && pcb_component_id === board.pcb_board_id)
        return null
      // A pcb_component inserted without a component, like an autoplaced
      // jumper's, may carry the subcircuit its elements don't
      const elementSubcircuitId =
        subcircuit_id ??
        (pcb_component_id
          ? db.pcb_component.get(pcb_component_id)?.subcircuit_id
          : undefined)
      if (elementSubcircuitId !== undefined)
        return boardSubcircuitIds.has(elementSubcircuitId)
          ? (pcb_component_id ?? null)
          : undefined
      // Elements that tell neither, like fiducial pads, are on the board they
      // overlap
      return !boardBounds || doBoundsOverlap(bounds, boardBounds)
        ? (pcb_component_id ?? null)
        : undefined
    },
    stitchingPcbViaIds: board._generatedStitchingViaIds,
    movablePcbSilkscreenTextIds,
  })

  // A part covers its pads and holes plus its own outline, courtyard and pin
  // labels, but not its own labels: its designator, even one that stays put,
  // and the labels placed beside it
  const outlineBoundsListByPcbComponentId = new Map<PcbComponentId, Bounds[]>()
  const addToPartOutline = (pcbComponentId: PcbComponentId, bounds: Bounds) => {
    const outlineBoundsList =
      outlineBoundsListByPcbComponentId.get(pcbComponentId) ?? []
    outlineBoundsList.push(bounds)
    outlineBoundsListByPcbComponentId.set(pcbComponentId, outlineBoundsList)
  }
  for (const obstacle of obstacles) {
    if (
      (obstacle.kind === "silkscreen" || obstacle.kind === "courtyard") &&
      obstacle.pcbComponentId
    )
      addToPartOutline(obstacle.pcbComponentId, obstacle.bounds)
  }
  for (const text of db.pcb_silkscreen_text.list()) {
    const partName = nameByPcbComponentId.get(text.pcb_component_id)
    if (partName === undefined || text.layer !== layer) continue
    if (
      text.text !== partName &&
      !movablePcbSilkscreenTextIds.has(text.pcb_silkscreen_text_id)
    )
      addToPartOutline(text.pcb_component_id, getTextBounds(text))
  }
  const parts: SilkscreenLabelPart[] = pcbComponents.map((pcbComponent) => ({
    pcbComponentId: pcbComponent.pcb_component_id,
    bounds: getBoundsUnion([
      getBoundFromCenteredRect({
        center: pcbComponent.center,
        width: pcbComponent.width,
        height: pcbComponent.height,
      }),
      ...(outlineBoundsListByPcbComponentId.get(
        pcbComponent.pcb_component_id,
      ) ?? []),
    ]),
  }))

  return {
    layer,
    boardOutline,
    parts,
    obstacles,
    labels,
  }
}
