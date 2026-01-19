import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { AnyCircuitElement } from "circuit-json"

/**
 * Helper to get an element's source group ID from various possible references
 */
export const getElementSourceGroupId = (
  db: CircuitJsonUtilObjects,
  element: AnyCircuitElement,
): string | null => {
  // Direct source_group_id (for groups, boards, etc.)
  if ("source_group_id" in element && element.source_group_id) {
    return element.source_group_id
  }

  // Via source_board_id
  if ("source_board_id" in element && element.source_board_id) {
    const board = db.source_board.get(element.source_board_id)
    return board?.source_group_id || null
  }

  // Via source_component_id
  if ("source_component_id" in element && element.source_component_id) {
    const comp = db.source_component.get(element.source_component_id)
    return comp?.source_group_id || null
  }

  // Via source_trace_id -> subcircuit_id -> source_group
  if ("source_trace_id" in element && element.source_trace_id) {
    const trace = db.source_trace.get(element.source_trace_id)
    if (trace?.subcircuit_id) {
      const group = db.source_group
        .list()
        .find((g) => g.subcircuit_id === trace.subcircuit_id)
      return group?.source_group_id || null
    }
  }

  return null
}
