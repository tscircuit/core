import { getBoundsFromPoints } from "@tscircuit/math-utils"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import type { IGroup } from "lib/components/primitive-components/Group/IGroup"

const NON_PHYSICAL_PCB_PRIMITIVE_PREFIXES = [
  "Silkscreen",
  "PcbNote",
  "Courtyard",
  "FabricationNote",
]

export function getBoundsOfPcbComponents(
  components: PrimitiveComponent[],
  {
    pcbLayoutPhase = "before_layout",
  }: {
    pcbLayoutPhase?: "before_layout" | "after_layout"
  } = {},
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
    boundsPoints.push(
      { x: center.x - width / 2, y: center.y - height / 2 },
      { x: center.x + width / 2, y: center.y + height / 2 },
    )
  }

  for (const child of components) {
    const childGroup = child as unknown as IGroup
    if (pcbLayoutPhase === "after_layout" && childGroup.pcb_group_id) {
      const pcbGroup = child.root?.db.pcb_group.get(childGroup.pcb_group_id)
      if (pcbGroup?.outline?.length) {
        boundsPoints.push(...pcbGroup.outline)
      } else if (pcbGroup && (pcbGroup.width || pcbGroup.height)) {
        addRect({
          center: pcbGroup.center,
          width: pcbGroup.width ?? 0,
          height: pcbGroup.height ?? 0,
        })
      }
    } else if (pcbLayoutPhase === "after_layout" && child.pcb_component_id) {
      const childBounds = child._getPcbCircuitJsonBounds()
      if (childBounds.width || childBounds.height) addRect(childBounds)
    } else if (
      child.isPcbPrimitive &&
      !NON_PHYSICAL_PCB_PRIMITIVE_PREFIXES.some((prefix) =>
        child.componentName.startsWith(prefix),
      )
    ) {
      if (pcbLayoutPhase === "after_layout") {
        const childBounds = child._getPcbCircuitJsonBounds()
        if (childBounds.width || childBounds.height) addRect(childBounds)
      } else {
        const center = child._getGlobalPcbPositionBeforeLayout()
        const { width, height } = child.getPcbSize()
        addRect({ center, width, height })
      }
    } else if (child.children.length > 0) {
      const childBounds = getBoundsOfPcbComponents(child.children, {
        pcbLayoutPhase,
      })
      if (childBounds.width > 0 || childBounds.height > 0) {
        boundsPoints.push(
          { x: childBounds.minX, y: childBounds.minY },
          { x: childBounds.maxX, y: childBounds.maxY },
        )
      }
    }
  }

  const bounds = getBoundsFromPoints(boundsPoints)
  if (!bounds) {
    return {
      minX: 0,
      minY: 0,
      maxX: 0,
      maxY: 0,
      width: 0,
      height: 0,
    }
  }

  return {
    ...bounds,
    width: bounds.maxX - bounds.minX,
    height: bounds.maxY - bounds.minY,
  }
}
