import { selectAll } from "css-select"
import type { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { cssSelectPrimitiveComponentAdapter } from "../base-components/PrimitiveComponent/cssSelectPrimitiveComponentAdapter"
import { preprocessSelector } from "../base-components/PrimitiveComponent/preprocessSelector"

export const getAssemblyScreenTarget = (
  component: PrimitiveComponent,
  connectsTo: string,
): PrimitiveComponent => {
  const rootComponent = component.root?.firstChild
  if (!rootComponent) {
    throw new Error(
      `Could not resolve assembly.screen "${component.name}" because the circuit has no root component`,
    )
  }

  let selectionScope: PrimitiveComponent = rootComponent
  let ancestor = component.parent
  while (ancestor) {
    if (ancestor.componentName === "AssemblyDevice") {
      selectionScope = ancestor
      break
    }
    ancestor = ancestor.parent
  }

  // Assembly-device wrappers are deliberately not electrical subcircuits. Use
  // the complete component-tree adapter within the nearest assembly device so
  // a selector can cross nested <assembly.device> and <board> boundaries while
  // identical component names in sibling product assemblies remain isolated.
  const matches = selectAll(
    preprocessSelector(connectsTo, component),
    selectionScope,
    { adapter: cssSelectPrimitiveComponentAdapter },
  )

  if (matches.length !== 1) {
    throw new Error(
      `assembly.screen "${component.name}" connectsTo selector "${connectsTo}" matched ${matches.length} components; expected exactly one`,
    )
  }

  const target = matches[0]!
  if (!target.pcb_component_id) {
    throw new Error(
      `assembly.screen "${component.name}" connectsTo selector "${connectsTo}" matched ${target.getString()}, but it has no PCB component`,
    )
  }

  return target
}
