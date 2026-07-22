import {
  getCircuitJsonTree,
  type CircuitJsonTreeNode,
} from "@tscircuit/circuit-json-util"
import type {
  AnyCircuitElement,
  SchematicSheet,
  SourceComponentBase,
  SourceGroup,
} from "circuit-json"

type SourceComponentId = SourceComponentBase["source_component_id"]
type SourceGroupId = SourceGroup["source_group_id"]
type SchematicSheetId = SchematicSheet["schematic_sheet_id"]
type SchematicCircuitJsonTreeForSheet = {
  tree: CircuitJsonTreeNode
  schematicSheetId?: SchematicSheetId
}

/**
 * The schematic sheet each source group lives on. A source group does not carry
 * schematic_sheet_id, so it is inferred from the components below it - a
 * component is always on a single sheet, so one id per group is enough.
 */
function getSchematicSheetIdBySourceGroupId({
  circuitJson,
  schematicSheetIdBySourceComponentId,
}: {
  circuitJson: AnyCircuitElement[]
  schematicSheetIdBySourceComponentId: Map<SourceComponentId, SchematicSheetId>
}): Map<SourceGroupId, SchematicSheetId> {
  const parentBySourceGroupId = new Map<
    SourceGroupId,
    SourceGroupId | undefined
  >()
  for (const element of circuitJson) {
    if (element.type === "source_group") {
      parentBySourceGroupId.set(
        element.source_group_id,
        element.parent_source_group_id,
      )
    }
  }

  const schematicSheetIdBySourceGroupId = new Map<
    SourceGroupId,
    SchematicSheetId
  >()
  for (const element of circuitJson) {
    if (element.type !== "source_component") continue
    if (!element.source_group_id) continue
    const schematicSheetId = schematicSheetIdBySourceComponentId.get(
      element.source_component_id,
    )
    if (schematicSheetId === undefined) continue
    // Propagate the component's sheet up to its ancestor groups. The `has` guard
    // stops at the first already-resolved group (and prevents cyclic loops).
    let sourceGroupId: SourceGroupId | undefined = element.source_group_id
    while (
      sourceGroupId &&
      !schematicSheetIdBySourceGroupId.has(sourceGroupId)
    ) {
      schematicSheetIdBySourceGroupId.set(sourceGroupId, schematicSheetId)
      sourceGroupId = parentBySourceGroupId.get(sourceGroupId)
    }
  }
  return schematicSheetIdBySourceGroupId
}

/**
 * Circuit json scoped to a single schematic sheet: the root group plus every
 * descendant group/component that lives on this sheet.
 */
function getCircuitJsonScopedToSchematicSheet({
  circuitJson,
  schematicSheetId,
  rootSourceGroupId,
  schematicSheetIdBySourceComponentId,
  schematicSheetIdBySourceGroupId,
}: {
  circuitJson: AnyCircuitElement[]
  schematicSheetId: SchematicSheetId
  rootSourceGroupId: SourceGroupId
  schematicSheetIdBySourceComponentId: Map<SourceComponentId, SchematicSheetId>
  schematicSheetIdBySourceGroupId: Map<SourceGroupId, SchematicSheetId>
}): AnyCircuitElement[] {
  // The root group holds every sheet's children, so it is always kept; only its
  // descendants are filtered down to the sheet being laid out.
  const isGroupOnSheet = (sourceGroupId: SourceGroupId): boolean =>
    sourceGroupId === rootSourceGroupId ||
    schematicSheetIdBySourceGroupId.get(sourceGroupId) === schematicSheetId

  return circuitJson.filter((element) => {
    if (element.type === "source_group") {
      return isGroupOnSheet(element.source_group_id)
    }
    if (element.type === "source_component") {
      if (
        schematicSheetIdBySourceComponentId.get(element.source_component_id) !==
        schematicSheetId
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
  opts: { source_group_id: SourceGroupId },
): SchematicCircuitJsonTreeForSheet[] {
  const { source_group_id } = opts
  const schematicSheetIdBySourceComponentId = new Map<
    SourceComponentId,
    SchematicSheetId
  >()
  for (const element of circuitJson) {
    if (element.type !== "schematic_component") continue
    if (!element.source_component_id) continue
    if (!element.schematic_sheet_id) continue
    schematicSheetIdBySourceComponentId.set(
      element.source_component_id,
      element.schematic_sheet_id,
    )
  }

  const schematicSheetIds = new Set<SchematicSheetId>(
    schematicSheetIdBySourceComponentId.values(),
  )

  // Without components spread across at least two sheets there is nothing to
  // separate - build the tree exactly as before.
  if (schematicSheetIds.size <= 1) {
    return [
      {
        tree: getCircuitJsonTree(circuitJson, { source_group_id }),
        schematicSheetId: schematicSheetIds.values().next().value,
      },
    ]
  }

  const schematicSheetIdBySourceGroupId = getSchematicSheetIdBySourceGroupId({
    circuitJson,
    schematicSheetIdBySourceComponentId,
  })

  return Array.from(schematicSheetIds).map((schematicSheetId) => ({
    tree: getCircuitJsonTree(
      getCircuitJsonScopedToSchematicSheet({
        circuitJson,
        schematicSheetId,
        rootSourceGroupId: source_group_id,
        schematicSheetIdBySourceComponentId,
        schematicSheetIdBySourceGroupId,
      }),
      { source_group_id },
    ),
    schematicSheetId,
  }))
}
