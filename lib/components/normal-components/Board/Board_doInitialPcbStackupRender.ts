import type { PcbBoard } from "circuit-json"
import { jlcpcbStackupPresets } from "lib/utils/stackup/jlcpcb-stackup-presets"
import type { Board } from "./Board"

export function Board_doInitialPcbStackupRender(
  board: Board,
  importedPcbBoard: PcbBoard | undefined,
): void {
  const { db } = board.root!
  const { pcb_board_id, subcircuit_id } = board
  if (!pcb_board_id || db.pcb_stackup.getWhere({ pcb_board_id })) return

  const { stackupPreset } = board._parsedProps
  const preset = stackupPreset ? jlcpcbStackupPresets[stackupPreset] : undefined
  if (preset) {
    const copperLayerCount = preset.layers.filter(
      (layer) => layer.layer_type === "copper",
    ).length
    if (copperLayerCount !== board.allLayers.length) {
      db.pcb_placement_error.insert({
        error_type: "pcb_placement_error",
        subcircuit_id: subcircuit_id ?? undefined,
        message: `Stackup preset "${stackupPreset}" requires ${copperLayerCount} copper layers, but board "${board.name}" has ${board.allLayers.length} layers. Set layers={${copperLayerCount}} or choose a matching stackup preset.`,
      })
      return
    }
  }

  // Inflation recreates pcb_board rather than copying it. Reassociate the
  // imported construction with the new board and preserve it instead of
  // generating a second stackup from the preset.
  const importedStackup = board._parsedProps.circuitJson?.find(
    (element) =>
      element.type === "pcb_stackup" &&
      element.pcb_board_id === importedPcbBoard?.pcb_board_id,
  )
  const layers = importedStackup?.layers ?? preset?.layers
  if (!layers) return

  db.pcb_stackup.insert({
    plated_hole_copper_thickness: importedStackup?.plated_hole_copper_thickness,
    pcb_board_id,
    subcircuit_id: subcircuit_id ?? undefined,
    layers: structuredClone(layers),
  })
}
