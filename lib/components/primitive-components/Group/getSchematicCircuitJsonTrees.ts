import {
  getCircuitJsonTree,
  type CircuitJsonTreeNode,
} from "@tscircuit/circuit-json-util"
import type { AnyCircuitElement } from "circuit-json"

/**
 * The schematic sheet each source group lives on. A source group does not carry
 * schematic_sheet_id, so it is inferred from the components below it - a
 * component is always on a single sheet, so one id per group is enough.
 */
function getSchematicSheetIdByGroupId({
  circuitJson,
  sheetIdBySourceComponentId,
}: {
  circuitJson: AnyCircuitElement[]
  sheetIdBySourceComponentId: Map<string, string>
}): Map<string, string> {
  const parentBySourceGroupId = new Map<string, string | undefined>()
  for (const element of circuitJson) {
    if (element.type === "source_group") {
      parentBySourceGroupId.set(
        element.source_group_id,
        element.parent_source_group_id,
      )
    }
  }

  const sheetIdByGroupId = new Map<string, string>()
  for (const element of circuitJson) {
    if (element.type !== "source_component") continue
    if (!element.source_group_id) continue
    const sheetId = sheetIdBySourceComponentId.get(element.source_component_id)
    if (sheetId === undefined) continue
    // Propagate the component's sheet up to its ancestor groups. The `has` guard
    // stops at the first already-resolved group (and prevents cyclic loops).
    let groupId: string | undefined = element.source_group_id
    while (groupId && !sheetIdByGroupId.has(groupId)) {
      sheetIdByGroupId.set(groupId, sheetId)
      groupId = parentBySourceGroupId.get(groupId)
    }
  }
  return sheetIdByGroupId
}

/**
 * Circuit json scoped to a single schematic sheet: the root group plus every
 * descendant group/component that lives on this sheet.
 */
function getCircuitJsonScopedToSchematicSheet({
  circuitJson,
  sheetId,
  rootSourceGroupId,
  sheetIdBySourceComponentId,
  sheetIdByGroupId,
}: {
  circuitJson: AnyCircuitElement[]
  sheetId: string
  rootSourceGroupId: string
  sheetIdBySourceComponentId: Map<string, string>
  sheetIdByGroupId: Map<string, string>
}): AnyCircuitElement[] {
  // The root group holds every sheet's children, so it is always kept; only its
  // descendants are filtered down to the sheet being laid out.
  const isGroupOnSheet = (sourceGroupId: string): boolean =>
    sourceGroupId === rootSourceGroupId ||
    sheetIdByGroupId.get(sourceGroupId) === sheetId

  return circuitJson.filter((element) => {
    if (element.type === "source_group") {
      return isGroupOnSheet(element.source_group_id)
    }
    if (element.type === "source_component") {
      if (
        sheetIdBySourceComponentId.get(element.source_component_id) !== sheetId
      ) {
        return false
      }
      return element.source_group_id
        ? isGroupOnSheet(element.source_group_id)
        : true
    }
    return true
  })
}

/**
 * Build the schematic layout tree(s) for a source group - one per schematic
 * sheet its components are spread across. Each tree is produced by
 * `getCircuitJsonTree` from a sheet-scoped circuit json, so the tree-building
 * logic lives in exactly one place and is never reimplemented here.
 *
 * Sheet membership is read straight from each component's `schematic_sheet_id`
 * (assigned during render); this function never decides it. With zero or one
 * sheet in play it returns the single unmodified tree, so plain circuits are
 * unaffected.
 */
export function getSchematicCircuitJsonTrees(
  circuitJson: AnyCircuitElement[],
  opts: { source_group_id: string },
): CircuitJsonTreeNode[] {
  const { source_group_id } = opts
  const sheetIdBySourceComponentId = new Map<string, string>()
  for (const element of circuitJson) {
    if (element.type !== "schematic_component") continue
    if (!element.source_component_id) continue
    if (!element.schematic_sheet_id) continue
    sheetIdBySourceComponentId.set(
      element.source_component_id,
      element.schematic_sheet_id,
    )
  }

  const sheetIds = new Set<string>(sheetIdBySourceComponentId.values())

  // Without components spread across at least two sheets there is nothing to
  // separate - build the tree exactly as before.
  if (sheetIds.size <= 1) {
    return [getCircuitJsonTree(circuitJson, { source_group_id })]
  }

  const sheetIdByGroupId = getSchematicSheetIdByGroupId({
    circuitJson,
    sheetIdBySourceComponentId,
  })

  return Array.from(sheetIds).map((sheetId) =>
    getCircuitJsonTree(
      getCircuitJsonScopedToSchematicSheet({
        circuitJson,
        sheetId,
        rootSourceGroupId: source_group_id,
        sheetIdBySourceComponentId,
        sheetIdByGroupId,
      }),
      { source_group_id },
    ),
  )
}
