import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"

export function getBoundsOfPcbComponents(
  components: PrimitiveComponent[],
  parentOffsetX: number = 0,
  parentOffsetY: number = 0,
) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const child of components) {
    // Check for PCB primitives (like smtpads)
    if (child.isPcbPrimitive) {
      const { x, y } = child._getGlobalPcbPositionBeforeLayout()
      const { width, height } = child.getPcbSize()
      minX = Math.min(minX, x + parentOffsetX - width / 2)
      minY = Math.min(minY, y + parentOffsetY - height / 2)
      maxX = Math.max(maxX, x + parentOffsetX + width / 2)
      maxY = Math.max(maxY, y + parentOffsetY + height / 2)
    }
    // For components that have PCB representations, look up their PCB component
    else if (child.root?.db) {
      const pcbComponents = child.root.db.pcb_component
        .list()
        .filter((pc) => pc.source_component_id === child.source_component_id)

      for (const pcbComponent of pcbComponents) {
        const x = pcbComponent.center.x
        const y = pcbComponent.center.y
        const { width, height } = pcbComponent

        minX = Math.min(minX, x + parentOffsetX - width / 2)
        minY = Math.min(minY, y + parentOffsetY - height / 2)
        maxX = Math.max(maxX, x + parentOffsetX + width / 2)
        maxY = Math.max(maxY, y + parentOffsetY + height / 2)
      }
    }
    // Check for footprints and groups that might contain PCB components
    else if (child.componentName === "Footprint" || child.isGroup) {
      // If it's a group, check for pcbX/pcbY props
      let childOffsetX = parentOffsetX
      let childOffsetY = parentOffsetY
      if (child.isGroup) {
        const props = child._parsedProps as any
        if (props.pcbX !== undefined) childOffsetX = props.pcbX
        if (props.pcbY !== undefined) childOffsetY = props.pcbY
      }

      const childBounds = getBoundsOfPcbComponents(
        child.children,
        childOffsetX,
        childOffsetY,
      )

      if (childBounds.width > 0 || childBounds.height > 0) {
        minX = Math.min(minX, childBounds.minX)
        minY = Math.min(minY, childBounds.minY)
        maxX = Math.max(maxX, childBounds.maxX)
        maxY = Math.max(maxY, childBounds.maxY)
      }
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
