import { getBoundsFromPoints } from "@tscircuit/math-utils"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import type { IGroup } from "lib/components/primitive-components/Group/IGroup"

const NON_PHYSICAL_PCB_PRIMITIVE_PREFIXES = [
  "Silkscreen",
  "PcbNote",
  "Courtyard",
  "FabricationNote",
]

export function getPostLayoutBoundsOfPcbComponents(
  components: PrimitiveComponent[],
) {
  const boundsPoints: Array<{ x: number; y: number }> = []
  const addRect = ({
    center,
    width,
    height,
  }: {
    center: { x: number; y: number }
    width: number
    height: number
  }) => {
    if (width <= 0 && height <= 0) return
    boundsPoints.push(
      { x: center.x - width / 2, y: center.y - height / 2 },
      { x: center.x + width / 2, y: center.y + height / 2 },
    )
  }

  for (const child of components) {
    const childGroup = child as unknown as IGroup
    if (childGroup.pcb_group_id && child.root) {
      const pcbGroup = child.root.db.pcb_group.get(childGroup.pcb_group_id)
      if (pcbGroup?.outline?.length) {
        boundsPoints.push(...pcbGroup.outline)
      } else if (pcbGroup) {
        addRect({
          center: pcbGroup.center,
          width: pcbGroup.width ?? 0,
          height: pcbGroup.height ?? 0,
        })
      }
    } else if (child.pcb_component_id) {
      addRect(child._getPcbCircuitJsonBounds())
    } else if (
      child.isPcbPrimitive &&
      !NON_PHYSICAL_PCB_PRIMITIVE_PREFIXES.some((prefix) =>
        child.componentName.startsWith(prefix),
      )
    ) {
      addRect(child._getPcbCircuitJsonBounds())
    } else if (child.children.length > 0) {
      const childBounds = getPostLayoutBoundsOfPcbComponents(child.children)
      if (childBounds.width > 0 || childBounds.height > 0) {
        boundsPoints.push(
          { x: childBounds.minX, y: childBounds.minY },
          { x: childBounds.maxX, y: childBounds.maxY },
        )
      }
    }
  }

  const bounds = getBoundsFromPoints(boundsPoints) ?? {
    minX: 0,
    minY: 0,
    maxX: 0,
    maxY: 0,
  }

  return {
    ...bounds,
    width: bounds.maxX - bounds.minX,
    height: bounds.maxY - bounds.minY,
  }
}
