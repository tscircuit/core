import {
  getJlcStackup,
  jlcStackups,
} from "@tscircuit/jlcpcb-manufacturing-specs"
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
  const { fabricatorPreset, jlcpcbStackup } = board._parsedProps
  if (!layers && (fabricatorPreset || jlcpcbStackup)) {
    const {
      num_layers,
      thickness,
      material = "fr4",
    } = importedPcbBoard ?? db.pcb_board.get(pcb_board_id)!
    const resolvedThickness = thickness ?? board.boardThickness
    layers = (
      jlcpcbStackup
        ? jlcStackups.find(
            (stackup) =>
              stackup.name === jlcpcbStackup &&
              stackup.num_layers === num_layers &&
              stackup.thickness === resolvedThickness &&
              stackup.material === material,
          )
        : getJlcStackup({
            num_layers,
            thickness: resolvedThickness,
            material,
          })
    )?.layers
  }
  if (!layers) return

  db.pcb_stackup.insert({
    plated_hole_copper_thickness: importedStackup?.plated_hole_copper_thickness,
    pcb_board_id,
    subcircuit_id: subcircuit_id ?? undefined,
    layers: structuredClone(layers),
  })
}
