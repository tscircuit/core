import type { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export const matchesAssemblyIdentity = (
  component: PrimitiveComponent,
  path: string,
) => {
  const names = path.split(".")
  let ancestor: PrimitiveComponent | null = component
  for (const name of names.reverse()) {
    if (!ancestor || ancestor.name !== name) return false
    ancestor = ancestor.parent
  }
  return true
}
