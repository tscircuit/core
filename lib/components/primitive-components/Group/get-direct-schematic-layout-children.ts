import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"

/**
 * Finds direct source components/groups while treating schematic-only
 * containers such as SchematicSection and SchematicSheet as transparent.
 */
export const getDirectSchematicLayoutChildren = (
  group: Pick<PrimitiveComponent, "children">,
): PrimitiveComponent[] => {
  const schematicLayoutChildren: PrimitiveComponent[] = []

  const visitChildren = (children: PrimitiveComponent[]) => {
    for (const child of children) {
      const participatesInAutoLayout =
        child.source_component_id !== null || child.source_group_id !== null

      if (participatesInAutoLayout) {
        schematicLayoutChildren.push(child)
        continue
      }

      visitChildren(child.children)
    }
  }

  visitChildren(group.children)
  return schematicLayoutChildren
}
