import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { AnyCircuitElement } from "circuit-json"
import { getElementSourceGroupId } from "./getElementSourceGroupId"

/**
 * Check if element belongs to board by walking up source group hierarchy
 */
export const doesElementBelongToBoard = (
  db: CircuitJsonUtilObjects,
  element: AnyCircuitElement,
  boardSourceGroupId: string,
): boolean => {
  const elementSourceGroupId = getElementSourceGroupId(db, element)
  if (!elementSourceGroupId) return false // Exclude global elements

  let currentGroupId: string | null = elementSourceGroupId
  while (currentGroupId) {
    if (currentGroupId === boardSourceGroupId) return true

    const group = db.source_group
      .list()
      .find((g) => g.source_group_id === currentGroupId)
    currentGroupId = group?.parent_source_group_id || null
  }

  return false
}
