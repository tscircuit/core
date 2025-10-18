import type { NormalComponent } from "./NormalComponent"
import type { Size } from "circuit-json"
import type { IGroup } from "lib/components/primitive-components/Group/IGroup"
import { getBoundsFromPoints } from "@tscircuit/math-utils"

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

    // If the group has an outline, calculate size from outline
    if (pcbGroup.outline && pcbGroup.outline.length > 0) {
      const bounds = getBoundsFromPoints(pcbGroup.outline)
      if (!bounds) return null
      return {
        width: bounds.maxX - bounds.minX,
        height: bounds.maxY - bounds.minY,
      }
    }

    // Otherwise use width and height
    return {
      width: pcbGroup.width ?? 0,
      height: pcbGroup.height ?? 0,
    }
  }

  return null
}
