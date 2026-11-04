import type { SchematicComponent } from "circuit-json"

/**
 * Horizontal label anchor points in schematic world coordinates: millimetres,
 * right-handed, +X right, +Y up, with counterclockwise-positive rotation.
 * The box size and
 * occupied pin sides must describe the box in that same frame after layout.
 */
export function getSchematicBoxLabelPositions({
  center,
  size,
  hasTopPins,
  hasBottomPins,
}: Pick<SchematicComponent, "center" | "size"> & {
  hasTopPins: boolean
  hasBottomPins: boolean
}) {
  const x = hasTopPins
    ? center.x + size.width / 2 + 0.1
    : center.x - size.width / 2
  const hasVerticalPins = hasTopPins || hasBottomPins

  return {
    manufacturerPartNumber: {
      x,
      y: hasVerticalPins
        ? center.y + size.height / 2 + 0.35
        : center.y - size.height / 2 - 0.13,
    },
    componentName: {
      x,
      y: hasVerticalPins
        ? center.y + size.height / 2 + 0.55
        : center.y + size.height / 2 + 0.13,
    },
  }
}
