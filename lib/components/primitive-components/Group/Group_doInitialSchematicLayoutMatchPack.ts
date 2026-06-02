import { getCircuitJsonTree } from "@tscircuit/circuit-json-util"
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

  applySchematicMatchPackLayoutToTree(group, tree)
}
