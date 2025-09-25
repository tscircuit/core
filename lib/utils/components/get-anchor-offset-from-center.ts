import type { NinePointAnchor } from "circuit-json"

export const getAnchorOffsetFromCenter = (
  alignment: NinePointAnchor,
  width: number,
  height: number,
) => {
  const halfWidth = width / 2
  const halfHeight = height / 2

  switch (alignment) {
    case "top_left":
      return { x: -halfWidth, y: -halfHeight }
    case "top_center":
      return { x: 0, y: -halfHeight }
    case "top_right":
      return { x: halfWidth, y: -halfHeight }
    case "center_left":
      return { x: -halfWidth, y: 0 }
    case "center":
      return { x: 0, y: 0 }
    case "center_right":
      return { x: halfWidth, y: 0 }
    case "bottom_left":
      return { x: -halfWidth, y: halfHeight }
    case "bottom_center":
      return { x: 0, y: halfHeight }
    case "bottom_right":
      return { x: halfWidth, y: halfHeight }
    default:
      return { x: 0, y: 0 }
  }
}
