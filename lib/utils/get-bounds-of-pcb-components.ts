import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { getAxisAlignedSizeFromRotatedRect } from "lib/utils/pcb/get-axis-aligned-size-from-rotated-rect"
import { applyToPoint, decomposeTSR } from "transformation-matrix"

const NON_PHYSICAL_PCB_PRIMITIVE_PREFIXES = [
  "Silkscreen",
  "PcbNote",
  "Courtyard",
  "FabricationNote",
]

function getPcbPrimitiveBoundsBeforeLayout(child: PrimitiveComponent) {
  const props = child._parsedProps
  if (
    child.componentName === "SmtPad" &&
    (props?.shape === "rotated_rect" || props?.shape === "rotated_pill")
  ) {
    const globalTransform = child._computePcbGlobalTransformBeforeLayout()
    const position = applyToPoint(globalTransform, { x: 0, y: 0 })
    const decomposedTransform = decomposeTSR(globalTransform)
    const rotationDegrees = (decomposedTransform.rotation.angle * 180) / Math.PI
    const normalizedRotationDegrees = ((rotationDegrees % 360) + 360) % 360
    const rotationTolerance = 0.01
    const transformRotationBeforeFlip =
      Math.abs(normalizedRotationDegrees - 360) < rotationTolerance
        ? 0
        : normalizedRotationDegrees
    const { isFlipped } = child._getPcbPrimitiveFlippedHelpers()
    const baseRotation = props.ccwRotation ?? 0
    const combinedRotationBeforeFlip =
      (transformRotationBeforeFlip + baseRotation + 360) % 360
    const padRotation = isFlipped
      ? (360 - combinedRotationBeforeFlip + 360) % 360
      : combinedRotationBeforeFlip
    const { xExtent, yExtent } = getAxisAlignedSizeFromRotatedRect({
      width: props.width,
      height: props.height,
      ccwRotationDegrees: padRotation,
    })
    return {
      left: position.x - xExtent,
      right: position.x + xExtent,
      top: position.y + yExtent,
      bottom: position.y - yExtent,
    }
  }

  return child._getPcbBoundsBeforeLayout()
}

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
      const bounds = getPcbPrimitiveBoundsBeforeLayout(child)
      minX = Math.min(minX, bounds.left)
      minY = Math.min(minY, bounds.bottom)
      maxX = Math.max(maxX, bounds.right)
      maxY = Math.max(maxY, bounds.top)
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
