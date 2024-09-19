import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"

export function getBoundsOfPcbComponents(components: PrimitiveComponent[]) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const child of components) {
    if (child.isPcbPrimitive) {
      const { x, y } = child._getGlobalPcbPositionBeforeLayout()
      const { width, height } = child.getPcbSize()
      minX = Math.min(minX, x - width / 2)
      minY = Math.min(minY, y - height / 2)
      maxX = Math.max(maxX, x + width / 2)
      maxY = Math.max(maxY, y + height / 2)
    } else if (child.componentName === "Footprint") {
      const childBounds = getBoundsOfPcbComponents(child.children)

      minX = Math.min(minX, childBounds.minX)
      minY = Math.min(minY, childBounds.minY)
      maxX = Math.max(maxX, childBounds.maxX)
      maxY = Math.max(maxY, childBounds.maxY)
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
