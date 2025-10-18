import type { NormalComponent } from "./NormalComponent"
import type { Size } from "circuit-json"
import type { IGroup } from "lib/components/primitive-components/Group/IGroup"

/**
 * Get the minimum flex container size for this component on PCB
 */
export const NormalComponent__getMinimumFlexContainerSize = (
  component: NormalComponent,
): Size | null => {
  const { db } = component.root!

  // For regular components, get PCB component size
  if (component.pcb_component_id) {
    const pcbComponent = db.pcb_component.get(component.pcb_component_id)
    if (!pcbComponent) return null
    return {
      width: pcbComponent.width,
      height: pcbComponent.height,
    }
  }

  // For groups, get PCB group size
  if ((component as unknown as IGroup).pcb_group_id) {
    const pcbGroup = db.pcb_group.get(
      (component as unknown as IGroup).pcb_group_id!,
    )
    if (!pcbGroup) return null
    return {
      width: pcbGroup.width ?? 0,
      height: pcbGroup.height ?? 0,
    }
  }

  return null
}
