import { getJlcStackup } from "@tscircuit/jlcpcb-manufacturing-specs"
import type { PcbBoard } from "circuit-json"
import type { Board } from "./Board"

export function Board_doInitialPcbStackupRender(
  board: Board,
  importedPcbBoard: PcbBoard | undefined,
): void {
  const { db } = board.root!
  const { pcb_board_id, subcircuit_id } = board
  if (!pcb_board_id || db.pcb_stackup.getWhere({ pcb_board_id })) return

  // Imported stackups take precedence and must use the new board ID.
  const importedStackup = board._parsedProps.circuitJson?.find(
    (element) =>
      element.type === "pcb_stackup" &&
      element.pcb_board_id === importedPcbBoard?.pcb_board_id,
  )
  let layers = importedStackup?.layers
  if (!layers && board._parsedProps.fabricatorPreset) {
    const { num_layers, thickness, material } =
      importedPcbBoard ?? db.pcb_board.get(pcb_board_id)!
    layers = getJlcStackup({
      num_layers,
      thickness: thickness ?? board.boardThickness,
      material,
    })?.layers
  }
  if (!layers) return

  db.pcb_stackup.insert({
    plated_hole_copper_thickness: importedStackup?.plated_hole_copper_thickness,
    pcb_board_id,
    subcircuit_id: subcircuit_id ?? undefined,
    layers: structuredClone(layers),
  })
}
