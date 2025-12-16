import type { GroupProps } from "@tscircuit/props"

export function computeCenterFromAnchorPosition(
  anchorPosition: { x: number; y: number },
  ctx: GroupProps,
): { x: number; y: number } {
  const { width, height, pcbAnchorAlignment } = ctx
  if (!pcbAnchorAlignment) return anchorPosition
  const alignment = pcbAnchorAlignment

  if (typeof width !== "number" || typeof height !== "number") {
    console.log("width or height is not a number")
    return anchorPosition
  }

  const ax = anchorPosition.x
  const ay = anchorPosition.y

  // PCB coordinate system uses Y-down (minY is "top"), consistent with
  // NormalComponent_doInitialPcbComponentAnchorAlignment.
  switch (alignment) {
    case "top_left":
      return { x: ax + width / 2, y: ay - height / 2 }
    case "top_center":
      return { x: ax, y: ay - height / 2 }
    case "top_right":
      return { x: ax - width / 2, y: ay - height / 2 }
    case "center_left":
      return { x: ax + width / 2, y: ay }
    case "center_right":
      return { x: ax - width / 2, y: ay }
    case "bottom_left":
      return { x: ax + width / 2, y: ay + height / 2 }
    case "bottom_center":
      return { x: ax, y: ay + height / 2 }
    case "bottom_right":
      return { x: ax - width / 2, y: ay + height / 2 }
    default:
      return anchorPosition
  }
}
