import {
  type CircuitJsonTreeNode,
  type CircuitJsonUtilObjects,
  getCircuitJsonTree,
} from "@tscircuit/circuit-json-util"
import type { z } from "zod"
import type { Group } from "./Group"
import { applySchematicMatchPackLayoutToTree } from "./applySchematicMatchPackLayoutToTree"

export { applySchematicMatchPackLayoutToTree } from "./applySchematicMatchPackLayoutToTree"

/**
 * Resolve which schematic sheet a tree child belongs to. Components map to
 * their schematic_component's `schematic_sheet_id`; a nested group uses the
 * sheet of one of its schematic components. Returns `undefined` when the child
 * is not assigned to any sheet.
 */
function getTreeChildSchematicSheetId(
  child: CircuitJsonTreeNode,
  db: CircuitJsonUtilObjects,
): string | undefined {
  if (child.nodeType === "component" && child.sourceComponent) {
    const schematicComponent = db.schematic_component.getWhere({
      source_component_id: child.sourceComponent.source_component_id,
    })
    return schematicComponent?.schematic_sheet_id ?? undefined
  }

  if (child.nodeType === "group" && child.sourceGroup) {
    // Identify the group's components the same way the matchpack conversion
    // does: via its schematic_group, then the components in that group.
    const schematicGroup = db.schematic_group?.getWhere?.({
      source_group_id: child.sourceGroup.source_group_id,
    })
    if (schematicGroup) {
      const [schematicComponent] = db.schematic_component.list({
        schematic_group_id: schematicGroup.schematic_group_id,
      })
      return schematicComponent?.schematic_sheet_id ?? undefined
    }
  }

  return undefined
}

export function Group_doInitialSchematicLayoutMatchPack<
  Props extends z.ZodType<any, any, any>,
>(group: Group<Props>): void {
  const { db } = group.root!

  const tree = getCircuitJsonTree(db.toArray(), {
    source_group_id: group.source_group_id!,
  })

  // Bucket children by schematic sheet so matchpack only ever lays out the
  // components of a single sheet at a time. Components on different sheets must
  // not be packed together or influence each other's placement. Children with
  // no sheet (`undefined`) share a single bucket.
  const childNodesBySheet = new Map<string | undefined, CircuitJsonTreeNode[]>()
  for (const child of tree.childNodes) {
    const sheetId = getTreeChildSchematicSheetId(child, db)
    const bucket = childNodesBySheet.get(sheetId)
    if (bucket) {
      bucket.push(child)
    } else {
      childNodesBySheet.set(sheetId, [child])
    }
  }

  // Single sheet (or no sheets at all): lay out the whole tree as before.
  if (childNodesBySheet.size <= 1) {
    applySchematicMatchPackLayoutToTree(group, tree)
    return
  }

  // Multiple sheets: lay each one out independently in its own coordinate space.
  for (const childNodes of childNodesBySheet.values()) {
    applySchematicMatchPackLayoutToTree(group, { ...tree, childNodes })
  }
}
