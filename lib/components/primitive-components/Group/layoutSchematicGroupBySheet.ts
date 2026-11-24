import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import type { z } from "zod"
import type { Group } from "./Group"
import { Group_doInitialSchematicLayoutSections } from "./Group_doInitialSchematicLayoutSections"
import { applySchematicMatchPackLayoutToTree } from "./applySchematicMatchPackLayoutToTree"
import { getSchematicCircuitJsonTrees } from "./getSchematicCircuitJsonTrees"

export const hasSchematicSections = (children: PrimitiveComponent[]) =>
  children.some(
    (child) =>
      child.source_component_id && child.getSchematicSectionName() !== null,
  )

export function layoutSchematicGroupBySheet<
  Props extends z.ZodType<any, any, any>,
>(group: Group<Props>, layoutChildren: PrimitiveComponent[]) {
  const trees = getSchematicCircuitJsonTrees(group.root!.db.toArray(), {
    source_group_id: group.source_group_id!,
  })
  for (const { tree, schematicSheetId } of trees) {
    // Use rendered sheet membership, which also covers schSheetName and multi-unit chips.
    const sheetChildren =
      trees.length === 1
        ? layoutChildren
        : layoutChildren.filter((child) =>
            tree.childNodes.some(
              (node) =>
                (child.source_component_id &&
                  node.sourceComponent?.source_component_id ===
                    child.source_component_id) ||
                (child.source_group_id &&
                  node.sourceGroup?.source_group_id === child.source_group_id),
            ),
          )
    if (hasSchematicSections(sheetChildren)) {
      Group_doInitialSchematicLayoutSections(
        group,
        tree,
        sheetChildren,
        schematicSheetId,
      )
    } else if (group._getSchematicLayoutMode(sheetChildren) === "match-adapt") {
      applySchematicMatchPackLayoutToTree(group, tree, {
        schematicSheetId,
        layoutChildren: sheetChildren,
      })
    }
  }
}
