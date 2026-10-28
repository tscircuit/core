import type { PcbBoard } from "circuit-json"
import type { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import type { Board } from "../normal-components/Board/Board"
import type { MountedBoard } from "../normal-components/MountedBoard"
import { getComponentsInAssemblyScope } from "./get-assembly-scope-components"

function isEndpointBoard(
  component: PrimitiveComponent,
): component is Board | MountedBoard {
  return (
    component.componentName === "Board" ||
    component.componentName === "MountedBoard"
  )
}

export function resolveAssemblyCableEndpointBoard({
  component,
  subcircuitId,
}: {
  component: PrimitiveComponent
  subcircuitId?: PcbBoard["subcircuit_id"]
}): Board | MountedBoard | undefined {
  let parent = component.parent
  if (subcircuitId) {
    const subcircuit = getComponentsInAssemblyScope(component).find(
      (part) =>
        part.isSubcircuit &&
        part.getSubcircuit().subcircuit_id === subcircuitId,
    )
    if (!subcircuit) return undefined
    parent = subcircuit
  }
  while (parent) {
    if (isEndpointBoard(parent)) return parent
    parent = parent.parent
  }
  return undefined
}
