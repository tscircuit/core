import { getBoundsFromPoints } from "@tscircuit/math-utils"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import type { IGroup } from "lib/components/primitive-components/Group/IGroup"

const NON_PHYSICAL_PCB_PRIMITIVE_PREFIXES = [
  "Silkscreen",
  "PcbNote",
  "Courtyard",
  "FabricationNote",
]

export function getBoundsOfPcbComponents(components: PrimitiveComponent[]) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  let hasValidComponents = false

  for (const child of components) {
    if (
      child.isPcbPrimitive &&
      !NON_PHYSICAL_PCB_PRIMITIVE_PREFIXES.some((prefix) =>
        child.componentName.startsWith(prefix),
      )
    ) {
      const { x, y } = child._getGlobalPcbPositionBeforeLayout()
      const { width, height } = child.getPcbSize()
      minX = Math.min(minX, x - width / 2)
      minY = Math.min(minY, y - height / 2)
      maxX = Math.max(maxX, x + width / 2)
      maxY = Math.max(maxY, y + height / 2)
      hasValidComponents = true
    }
    // Handle components that contain PCB primitives (like resistors)
    else if (child.children.length > 0) {
      const childBounds = getBoundsOfPcbComponents(child.children)
      if (childBounds.width > 0 || childBounds.height > 0) {
        minX = Math.min(minX, childBounds.minX)
        minY = Math.min(minY, childBounds.minY)
        maxX = Math.max(maxX, childBounds.maxX)
        maxY = Math.max(maxY, childBounds.maxY)
        hasValidComponents = true
      }
    }
  }

  if (!hasValidComponents) {
    return {
      minX: 0,
      minY: 0,
      maxX: 0,
      maxY: 0,
      width: 0,
      height: 0,
    }
  }

  let width = maxX - minX
  let height = maxY - minY

  if (width < 0) width = 0
  if (height < 0) height = 0

  return {
    minX,
    minY,
    maxX,
    maxY,
    width,
    height,
  }
}

export function getPostLayoutBoundsOfPcbComponents(
  components: PrimitiveComponent[],
) {
  const pcbComponentBoundsPoints: Array<{ x: number; y: number }> = []

  const includeBounds = ({
    center,
    width,
    height,
  }: {
    center: { x: number; y: number }
    width: number
    height: number
  }) => {
    if (width <= 0 && height <= 0) return
    pcbComponentBoundsPoints.push(
      { x: center.x - width / 2, y: center.y - height / 2 },
      { x: center.x + width / 2, y: center.y + height / 2 },
    )
  }

  for (const child of components) {
    const childGroup = child as unknown as IGroup
    if (childGroup.pcb_group_id && child.root) {
      const pcbGroup = child.root.db.pcb_group.get(childGroup.pcb_group_id)
      if (pcbGroup?.outline?.length) {
        const outlineBounds = getBoundsFromPoints(pcbGroup.outline)
        if (outlineBounds) {
          includeBounds({
            center: {
              x: (outlineBounds.minX + outlineBounds.maxX) / 2,
              y: (outlineBounds.minY + outlineBounds.maxY) / 2,
            },
            width: outlineBounds.maxX - outlineBounds.minX,
            height: outlineBounds.maxY - outlineBounds.minY,
          })
          continue
        }
      }
      if (pcbGroup?.width || pcbGroup?.height) {
        includeBounds({
          center: pcbGroup.center,
          width: pcbGroup.width ?? 0,
          height: pcbGroup.height ?? 0,
        })
        continue
      }
    }

    if (child.pcb_component_id) {
      includeBounds(child._getPcbCircuitJsonBounds())
      continue
    }

    if (
      child.isPcbPrimitive &&
      !NON_PHYSICAL_PCB_PRIMITIVE_PREFIXES.some((prefix) =>
        child.componentName.startsWith(prefix),
      )
    ) {
      includeBounds(child._getPcbCircuitJsonBounds())
      continue
    }

    if (child.children.length > 0) {
      const childBounds = getPostLayoutBoundsOfPcbComponents(child.children)
      if (childBounds.width > 0 || childBounds.height > 0) {
        pcbComponentBoundsPoints.push(
          { x: childBounds.minX, y: childBounds.minY },
          { x: childBounds.maxX, y: childBounds.maxY },
        )
      }
    }
  }

  const bounds = getBoundsFromPoints(pcbComponentBoundsPoints)
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
