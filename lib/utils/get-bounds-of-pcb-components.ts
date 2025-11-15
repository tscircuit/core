import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"

export function getBoundsOfPcbComponents(components: PrimitiveComponent[]) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  let hasValidComponents = false

  for (const child of components) {
    const isSilkscreen = child.componentName.startsWith("Silkscreen")
    const isHoleComponent = child.componentName === "Hole"

    if ((child.isPcbPrimitive && !isSilkscreen) || isHoleComponent) {
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
