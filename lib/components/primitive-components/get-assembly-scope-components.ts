import type { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export const getAssemblyScope = (
  component: PrimitiveComponent,
): PrimitiveComponent => {
  let ancestor = component.parent
  while (ancestor) {
    if (ancestor.componentName === "AssemblyDevice") return ancestor
    ancestor = ancestor.parent
  }
  return component.root!.firstChild!
}

export const getComponentsInAssemblyScope = (component: PrimitiveComponent) => {
  const scope = getAssemblyScope(component)
  return [scope, ...scope.getDescendants()].filter(
    (descendant) => getAssemblyScope(descendant) === scope,
  )
}
