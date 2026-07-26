import type { z } from "zod"
import type { Group } from "./Group"
import { applySchematicMatchPackLayoutToTree } from "./applySchematicMatchPackLayoutToTree"
import { getSchematicCircuitJsonTrees } from "./getSchematicCircuitJsonTrees"

export { applySchematicMatchPackLayoutToTree } from "./applySchematicMatchPackLayoutToTree"

export function Group_doInitialSchematicLayoutMatchPack<
  Props extends z.ZodType<any, any, any>,
>(group: Group<Props>): void {
  const { db } = group.root!

  const trees = getSchematicCircuitJsonTrees(db.toArray(), {
    source_group_id: group.source_group_id!,
  })

  for (const { tree, schematicSheetId } of trees) {
    applySchematicMatchPackLayoutToTree(group, tree, { schematicSheetId })
  }
}
