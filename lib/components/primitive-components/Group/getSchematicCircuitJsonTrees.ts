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
 * The schematic sheets each source group lives on. A source group does not
 * carry schematic_sheet_id, so they are inferred from the components below it.
 */
function getSchematicSheetIdsBySourceGroupId({
  circuitJson,
  schematicSheetIdsBySourceComponentId,
}: {
  circuitJson: AnyCircuitElement[]
  schematicSheetIdsBySourceComponentId: Map<
    SourceComponentId,
    Set<SchematicSheetId>
  >
}): Map<SourceGroupId, Set<SchematicSheetId>> {
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

  const schematicSheetIdsBySourceGroupId = new Map<
    SourceGroupId,
    Set<SchematicSheetId>
  >()
  for (const element of circuitJson) {
    if (element.type !== "source_component") continue
    if (!element.source_group_id) continue
    const schematicSheetIds = schematicSheetIdsBySourceComponentId.get(
      element.source_component_id,
    )
    if (schematicSheetIds === undefined) continue
    for (const schematicSheetId of schematicSheetIds) {
      let sourceGroupId: SourceGroupId | undefined = element.source_group_id
      const visitedSourceGroupIds = new Set<SourceGroupId>()
      while (sourceGroupId && !visitedSourceGroupIds.has(sourceGroupId)) {
        visitedSourceGroupIds.add(sourceGroupId)
        const groupSchematicSheetIds =
          schematicSheetIdsBySourceGroupId.get(sourceGroupId) ??
          new Set<SchematicSheetId>()
        groupSchematicSheetIds.add(schematicSheetId)
        schematicSheetIdsBySourceGroupId.set(
          sourceGroupId,
          groupSchematicSheetIds,
        )
        sourceGroupId = parentBySourceGroupId.get(sourceGroupId)
      }
    }
  }
  return schematicSheetIdsBySourceGroupId
}

/**
 * Circuit json scoped to a single schematic sheet: the root group plus every
 * descendant group/component that lives on this sheet.
 */
function getCircuitJsonScopedToSchematicSheet({
  circuitJson,
  schematicSheetId,
  rootSourceGroupId,
  schematicSheetIdsBySourceComponentId,
  schematicSheetIdsBySourceGroupId,
}: {
  circuitJson: AnyCircuitElement[]
  schematicSheetId: SchematicSheetId
  rootSourceGroupId: SourceGroupId
  schematicSheetIdsBySourceComponentId: Map<
    SourceComponentId,
    Set<SchematicSheetId>
  >
  schematicSheetIdsBySourceGroupId: Map<SourceGroupId, Set<SchematicSheetId>>
}): AnyCircuitElement[] {
  // The root group holds every sheet's children, so it is always kept; only its
  // descendants are filtered down to the sheet being laid out.
  const isGroupOnSheet = (sourceGroupId: SourceGroupId): boolean =>
    sourceGroupId === rootSourceGroupId ||
    schematicSheetIdsBySourceGroupId
      .get(sourceGroupId)
      ?.has(schematicSheetId) === true

  return circuitJson.filter((element) => {
    if (element.type === "source_group") {
      return isGroupOnSheet(element.source_group_id)
    }
    if (element.type === "source_component") {
      if (
        schematicSheetIdsBySourceComponentId
          .get(element.source_component_id)
          ?.has(schematicSheetId) !== true
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
  const schematicSheetIdsBySourceComponentId = new Map<
    SourceComponentId,
    Set<SchematicSheetId>
  >()
  for (const element of circuitJson) {
    if (element.type !== "schematic_component") continue
    if (!element.source_component_id) continue
    if (!element.schematic_sheet_id) continue
    const schematicSheetIds =
      schematicSheetIdsBySourceComponentId.get(element.source_component_id) ??
      new Set<SchematicSheetId>()
    schematicSheetIds.add(element.schematic_sheet_id)
    schematicSheetIdsBySourceComponentId.set(
      element.source_component_id,
      schematicSheetIds,
    )
  }

  const schematicSheetIds = new Set<SchematicSheetId>()
  for (const componentSchematicSheetIds of schematicSheetIdsBySourceComponentId.values()) {
    for (const schematicSheetId of componentSchematicSheetIds) {
      schematicSheetIds.add(schematicSheetId)
    }
  }

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

  const schematicSheetIdsBySourceGroupId = getSchematicSheetIdsBySourceGroupId({
    circuitJson,
    schematicSheetIdsBySourceComponentId,
  })

  return Array.from(schematicSheetIds).map((schematicSheetId) => ({
    tree: getCircuitJsonTree(
      getCircuitJsonScopedToSchematicSheet({
        circuitJson,
        schematicSheetId,
        rootSourceGroupId: source_group_id,
        schematicSheetIdsBySourceComponentId,
        schematicSheetIdsBySourceGroupId,
      }),
      { source_group_id },
    ),
    schematicSheetId,
  }))
}
