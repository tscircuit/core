import { buildSubtree } from "@tscircuit/circuit-json-util"
import type {
  AnyCircuitElement,
  DrawingPartView,
  DrawingPartSelection,
} from "circuit-json"

/** Select finalized CAD/PCB world geometry (right-handed XYZ, +Z up, mm).
 * Standalone board holes belong to subcircuits rather than source components.
 */
export function getDrawingViewGeometry(
  circuitJson: AnyCircuitElement[],
  view: Pick<DrawingPartView, "source_group_id" | "source_component_ids"> &
    Pick<DrawingPartSelection, "pcb_board_ids">,
) {
  const geometry = circuitJson.filter(
    (element) => !element.type.startsWith("drawing_"),
  )
  const ids = new Set(view.source_component_ids)
  const selected = view.source_group_id
    ? buildSubtree(geometry, { source_group_id: view.source_group_id })
    : geometry.filter(
        (element) =>
          (element.type === "cad_component" ||
            element.type === "source_component") &&
          ids.has(element.source_component_id),
      )
  if (view.source_group_id) {
    const subcircuitIds = new Set(
      selected.flatMap((element) =>
        element.type === "source_group" && element.subcircuit_id
          ? [element.subcircuit_id]
          : [],
      ),
    )
    const selectedElements = new Set(selected)
    selected.push(
      ...geometry.filter(
        (element) =>
          element.type.startsWith("pcb_") &&
          "subcircuit_id" in element &&
          subcircuitIds.has(element.subcircuit_id!) &&
          !("pcb_component_id" in element && element.pcb_component_id) &&
          !selectedElements.has(element),
      ),
    )
  }
  const boardIds = new Set(view.pcb_board_ids)
  const boards = geometry.flatMap((element) =>
    element.type === "pcb_board" && boardIds.has(element.pcb_board_id)
      ? [element]
      : [],
  )
  const subcircuits = new Set(boards.map((board) => board.subcircuit_id))
  const selectedElements = new Set(selected)
  selected.push(
    ...geometry.filter(
      (element) =>
        !selectedElements.has(element) &&
        element.type.startsWith("pcb_") &&
        "subcircuit_id" in element &&
        subcircuits.has(element.subcircuit_id) &&
        !("pcb_component_id" in element && element.pcb_component_id),
    ),
  )
  return selected
}
