import { getCircuitJsonTree } from "@tscircuit/circuit-json-util"
import type { z } from "zod"
import type { Group } from "./Group"
import { applySchematicMatchPackLayoutToTree } from "./applySchematicMatchPackLayoutToTree"

export { applySchematicMatchPackLayoutToTree } from "./applySchematicMatchPackLayoutToTree"

export function Group_doInitialSchematicLayoutMatchPack<
  Props extends z.ZodType<any, any, any>,
>(group: Group<Props>): void {
  const { db } = group.root!

  // Collect the distinct schematic sheets used by this group's layout children,
  // using the same resolution the rest of the schematic render uses.
  const sheetIds = new Set<string | undefined>()
  for (const child of group.children) {
    if (!child.source_component_id && !child.source_group_id) continue
    sheetIds.add(child._resolveSchematicSheetId())
  }

  // A single sheet (or none) lays the whole group out together, as before.
  if (sheetIds.size <= 1) {
    const tree = getCircuitJsonTree(db.toArray(), {
      source_group_id: group.source_group_id!,
    })
    applySchematicMatchPackLayoutToTree(group, tree)
    return
  }

  // Otherwise lay out each sheet independently, so matchpack only ever receives
  // the components of one sheet at a time. This mirrors how sections are laid
  // out in Group_doInitialSchematicLayoutSections: compute a tree per sheet and
  // narrow it to that sheet's children.
  for (const sheetId of sheetIds) {
    const sheetTree = getCircuitJsonTree(db.toArray(), {
      source_group_id: group.source_group_id!,
    })
    sheetTree.childNodes = sheetTree.childNodes.filter((childNode) => {
      const sourceId =
        childNode.sourceComponent?.source_component_id ??
        childNode.sourceGroup?.source_group_id
      const childInstance = group.children.find(
        (c) =>
          c.source_component_id === sourceId || c.source_group_id === sourceId,
      )
      return childInstance?._resolveSchematicSheetId() === sheetId
    })
    applySchematicMatchPackLayoutToTree(group, sheetTree)
  }
}
