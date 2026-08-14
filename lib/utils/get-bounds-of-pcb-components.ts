import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { applyToPoint } from "transformation-matrix"

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
      const { width, height } = child.getPcbSize()
      const footprintLocalCorners = [
        { x: -width / 2, y: -height / 2 },
        { x: width / 2, y: -height / 2 },
        { x: width / 2, y: height / 2 },
        { x: -width / 2, y: height / 2 },
      ]

      // Points enter in the primitive's footprint-local frame and leave in the
      // board-world frame. Axes are +X right, +Y top; all values are in mm.
      const boardWorldCorners = footprintLocalCorners.map((corner) =>
        applyToPoint(child._computePcbGlobalTransformBeforeLayout(), corner),
      )
      const cornerXs = boardWorldCorners.map((corner) => corner.x)
      const cornerYs = boardWorldCorners.map((corner) => corner.y)

      minX = Math.min(minX, ...cornerXs)
      minY = Math.min(minY, ...cornerYs)
      maxX = Math.max(maxX, ...cornerXs)
      maxY = Math.max(maxY, ...cornerYs)
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
