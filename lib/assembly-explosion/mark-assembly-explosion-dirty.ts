import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"

/** Stage ordering and membership can depend on sibling stages/moves. */
export function markAssemblyExplosionDirty(component: PrimitiveComponent) {
  for (const root of component.root?.children ?? []) {
    for (const part of [root, ...root.getDescendants()]) {
      if (
        part.componentName === "AssemblyExplosionStage" ||
        part.componentName === "AssemblyExplosionMove"
      )
        part._markDirty("CadExplosionRender")
    }
  }
}
