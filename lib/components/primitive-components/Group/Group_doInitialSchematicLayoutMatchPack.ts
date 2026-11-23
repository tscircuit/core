import type { SchematicLayoutContext } from "lib/utils/schematic/run-schematic-layout"
import { applySchematicMatchPackLayoutToTree } from "./applySchematicMatchPackLayoutToTree"
import { getSchematicCircuitJsonTrees } from "./getSchematicCircuitJsonTrees"

export { applySchematicMatchPackLayoutToTree } from "./applySchematicMatchPackLayoutToTree"

export function Group_doInitialSchematicLayoutMatchPack({
  group,
  db,
}: SchematicLayoutContext): void {
  const trees = getSchematicCircuitJsonTrees(db.toArray(), {
    source_group_id: group.source_group_id!,
  })

  for (const { tree, schematicSheetId } of trees) {
    applySchematicMatchPackLayoutToTree({ group, db }, tree, {
      schematicSheetId,
    })
  }
}
