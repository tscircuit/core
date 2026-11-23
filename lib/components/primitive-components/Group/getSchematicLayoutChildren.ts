import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"

// Sheets assign page membership. Nested groups and symbols own their own layout.
export function getSchematicLayoutChildren(
  children: PrimitiveComponent[],
): PrimitiveComponent[] {
  return children.flatMap((child) =>
    child.componentName === "SchematicSheet"
      ? getSchematicLayoutChildren(child.children)
      : [child],
  )
}
