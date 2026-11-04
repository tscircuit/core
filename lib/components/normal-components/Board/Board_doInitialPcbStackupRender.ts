import {
  getJlcStackup,
  jlcStackups,
  type JlcStackup,
} from "@tscircuit/jlcpcb-manufacturing-specs"
import type { PcbBoard } from "circuit-json"
import type { Board } from "./Board"

export function findJlcpcbStackupByName(
  name: string | undefined,
): JlcStackup | undefined {
  const normalizedName = name?.trim().toUpperCase()
  if (!normalizedName) return undefined
  return jlcStackups.find(
    (stackup) => stackup.name.toUpperCase() === normalizedName,
  )
}

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
  const requestedStackupName = board._parsedProps.jlcpcbStackup
  if (!layers && requestedStackupName) {
    const { num_layers, thickness, material } =
      importedPcbBoard ?? db.pcb_board.get(pcb_board_id)!
    const effectiveThickness = thickness ?? board.boardThickness
    const effectiveMaterial = material ?? "fr4"
    const namedStackup = findJlcpcbStackupByName(requestedStackupName)

    if (!namedStackup) {
      const matchingNames = jlcStackups
        .filter(
          (stackup) =>
            stackup.num_layers === num_layers &&
            Math.abs(stackup.thickness - effectiveThickness) < 1e-6 &&
            stackup.material === effectiveMaterial,
        )
        .map((stackup) => stackup.name)
      const matchingSuffix =
        matchingNames.length > 0
          ? ` Matching JLCPCB stackups for ${num_layers}-layer ${effectiveThickness}mm ${effectiveMaterial}: ${matchingNames.join(", ")}.`
          : ""
      db.source_invalid_component_property_error.insert({
        source_component_id: board.source_component_id ?? "",
        property_name: "jlcpcbStackup",
        error_type: "source_invalid_component_property_error",
        message: `Unknown jlcpcbStackup "${requestedStackupName}".${matchingSuffix}`,
      })
      return
    }

    if (
      namedStackup.num_layers !== num_layers ||
      Math.abs(namedStackup.thickness - effectiveThickness) > 1e-6 ||
      namedStackup.material !== effectiveMaterial
    ) {
      db.source_invalid_component_property_error.insert({
        source_component_id: board.source_component_id ?? "",
        property_name: "jlcpcbStackup",
        error_type: "source_invalid_component_property_error",
        message: `jlcpcbStackup "${namedStackup.name}" is a ${namedStackup.num_layers}-layer ${namedStackup.thickness}mm ${namedStackup.material} stackup, which does not match board construction (${num_layers}-layer ${effectiveThickness}mm ${effectiveMaterial}).`,
      })
      return
    }

    layers = namedStackup.layers
  } else if (!layers && board._parsedProps.fabricatorPreset) {
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
