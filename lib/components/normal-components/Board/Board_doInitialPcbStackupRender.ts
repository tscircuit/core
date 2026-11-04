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
  const { fabricatorPreset } = board._parsedProps
  if (!layers && fabricatorPreset) {
    const {
      num_layers,
      thickness: boardThickness,
      material = "fr4",
    } = importedPcbBoard ?? db.pcb_board.get(pcb_board_id)!
    const thickness = boardThickness ?? board.boardThickness
    layers = getJlcStackup({ num_layers, thickness, material })?.layers
    if (!layers) {
      // Explain why the preset produced no stackup instead of silently
      // omitting it, e.g. a 2-layer 1.5mm board.
      const supportedThicknesses = [
        ...new Set(
          jlcStackups
            .filter(
              (stackup) =>
                stackup.num_layers === num_layers &&
                stackup.material === material,
            )
            .map((stackup) => stackup.thickness),
        ),
      ].sort((a, b) => a - b)
      db.source_property_ignored_warning.insert({
        source_component_id: board.source_group_id ?? "",
        property_name: "fabricatorPreset",
        error_type: "source_property_ignored_warning",
        subcircuit_id: subcircuit_id ?? undefined,
        message:
          `fabricatorPreset "${fabricatorPreset}" has no stackup template for a ${num_layers}-layer ${thickness}mm ${material} board, so no pcb_stackup was emitted. ` +
          (supportedThicknesses.length > 0
            ? `Supported thicknesses for ${num_layers}-layer ${material}: ${supportedThicknesses.map((t) => `${t}mm`).join(", ")}. Set thickness on <board> to one of these.`
            : `No ${num_layers}-layer ${material} stackups are supported.`),
      })
    }
  }
  if (!layers) return

  db.pcb_stackup.insert({
    plated_hole_copper_thickness: importedStackup?.plated_hole_copper_thickness,
    pcb_board_id,
    subcircuit_id: subcircuit_id ?? undefined,
    layers: structuredClone(layers),
  })
}
