import {
  type CircuitJsonTreeNode,
  getCircuitJsonTree,
} from "@tscircuit/circuit-json-util"
import type { z } from "zod"
import type { Group } from "./Group"
import { applySchematicMatchPackLayoutToTree } from "./applySchematicMatchPackLayoutToTree"

export { applySchematicMatchPackLayoutToTree } from "./applySchematicMatchPackLayoutToTree"

export function Group_doInitialSchematicLayoutMatchPack<
  Props extends z.ZodType<any, any, any>,
>(group: Group<Props>): void {
  const { db } = group.root!

  const tree = getCircuitJsonTree(db.toArray(), {
    source_group_id: group.source_group_id!,
  })

  // Resolve the schematic sheet each layout child belongs to, indexed by source
  // id, using the same resolution the rest of the schematic render uses.
  const sheetIdBySourceId = new Map<string, string | undefined>()
  for (const child of group.children) {
    const sourceId = child.source_component_id ?? child.source_group_id
    if (!sourceId) continue
    sheetIdBySourceId.set(sourceId, child._resolveSchematicSheetId())
  }

  // Partition the tree's children by the sheet they belong to in a single pass.
  const childNodesBySheetId = new Map<
    string | undefined,
    CircuitJsonTreeNode[]
  >()
  for (const childNode of tree.childNodes) {
    const sourceId =
      childNode.sourceComponent?.source_component_id ??
      childNode.sourceGroup?.source_group_id
    let sheetId: string | undefined
    if (sourceId) sheetId = sheetIdBySourceId.get(sourceId)

    const childNodesForSheet = childNodesBySheetId.get(sheetId)
    if (childNodesForSheet) {
      childNodesForSheet.push(childNode)
    } else {
      childNodesBySheetId.set(sheetId, [childNode])
    }
  }

  // A single sheet (or none) lays the whole group out together, as before.
  if (childNodesBySheetId.size <= 1) {
    applySchematicMatchPackLayoutToTree(group, tree)
    return
  }

  // Otherwise lay out each sheet on its own tree, so matchpack only ever
  // receives the components of one sheet at a time.
  for (const childNodes of childNodesBySheetId.values()) {
    applySchematicMatchPackLayoutToTree(group, { ...tree, childNodes })
  }
}
