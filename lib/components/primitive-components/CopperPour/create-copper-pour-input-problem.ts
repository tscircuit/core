import { convertCircuitJsonToInputProblem } from "@tscircuit/copper-pour-solver"
import type { AnyCircuitElement } from "circuit-json"
import type { ISubcircuit } from "../Group/Subcircuit/ISubcircuit"
import type { Net } from "../Net"
import type { CopperPour } from "./CopperPour"

const DEFAULT_THERMAL_RELIEF_SPOKE_WIDTH_MM = 0.3

export type ResolvedCopperPour = {
  copperPour: CopperPour
  sourceNetId: string
}

export function collectResolvedCopperPours(
  subcircuit: ISubcircuit,
  options?: { reportMissingNet?: boolean },
): ResolvedCopperPour[] {
  const copperPours = subcircuit
    .selectAll<CopperPour>("copperpour")
    .filter((copperPour) => copperPour.getSubcircuit() === subcircuit)
  const resolvedCopperPours: ResolvedCopperPour[] = []

  for (const copperPour of copperPours) {
    const { _parsedProps: props } = copperPour
    const net = subcircuit.selectOne<Net>(props.connectsTo)
    const sourceNetId = net?.source_net_id
    if (!sourceNetId) {
      if (options?.reportMissingNet) {
        copperPour.renderError(
          `Net "${props.connectsTo}" not found for copper pour`,
        )
      }
      continue
    }
    resolvedCopperPours.push({ copperPour, sourceNetId })
  }

  return resolvedCopperPours
}

/**
 * Solver input for every pour in one subcircuit. Outlines and margins are
 * board-world millimetres (+X right, +Y up). `circuitJson` is the copper the
 * fill is allowed to see.
 */
export function createCopperPourInputProblem(
  subcircuit: ISubcircuit,
  circuitJson: AnyCircuitElement[],
  resolvedCopperPours: ResolvedCopperPour[],
) {
  const boardComponent = subcircuit._getBoard()
  const pcbBoard = boardComponent?.pcb_board_id
    ? subcircuit.root?.db.pcb_board.get(boardComponent.pcb_board_id)
    : undefined
  let resolvedPcbBoardOutline = pcbBoard?.outline?.length
    ? pcbBoard.outline
    : undefined
  if (
    !resolvedPcbBoardOutline &&
    pcbBoard?.width !== undefined &&
    pcbBoard.height !== undefined
  ) {
    const { center, width, height } = pcbBoard
    resolvedPcbBoardOutline = [
      { x: center.x - width / 2, y: center.y - height / 2 },
      { x: center.x + width / 2, y: center.y - height / 2 },
      { x: center.x + width / 2, y: center.y + height / 2 },
      { x: center.x - width / 2, y: center.y + height / 2 },
    ]
  }

  // warningOnly affects routing and DRC severity; pours still avoid every keepout.
  return convertCircuitJsonToInputProblem(
    circuitJson,
    resolvedCopperPours.map(({ copperPour, sourceNetId }) => {
      const { _parsedProps: props } = copperPour
      const clearance = props.clearance ?? 0.2
      return {
        layer: props.layer,
        crosshatch: props.crosshatch,
        crosshatchPitch: props.crosshatchPitch,
        crosshatchWidth: props.crosshatchWidth,
        subcircuit_id: subcircuit.subcircuit_id ?? undefined,
        source_net_id: sourceNetId,
        pad_margin: props.padMargin ?? clearance,
        trace_margin: props.traceMargin ?? clearance,
        pour_margin: clearance,
        board_edge_margin: props.boardEdgeMargin ?? clearance,
        board_edge_outline: copperPour._isImplicitCopperPour
          ? resolvedPcbBoardOutline
          : undefined,
        cutout_margin: props.cutoutMargin ?? clearance,
        ...(props.useThermalReliefs
          ? {
              use_thermal_reliefs: true,
              thermal_relief_spoke_width: DEFAULT_THERMAL_RELIEF_SPOKE_WIDTH_MM,
            }
          : {}),
        outline: props.outline ?? resolvedPcbBoardOutline,
      }
    }),
  )
}
