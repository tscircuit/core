export const getBoardCenterFromAnchor = ({
  boardAnchorPosition,
  boardAnchorAlignment,
  width,
  height,
}: {
  boardAnchorPosition: { x: number; y: number }
  boardAnchorAlignment: string
  width: number
  height: number
}) => {
  const { x: ax, y: ay } = boardAnchorPosition

  let cx = ax
  let cy = ay

  switch (boardAnchorAlignment) {
    case "top_left":
      cx = ax + width / 2
      cy = ay - height / 2
      break
    case "top_right":
      cx = ax - width / 2
      cy = ay - height / 2
      break
    case "bottom_left":
      cx = ax + width / 2
      cy = ay + height / 2
      break
    case "bottom_right":
      cx = ax - width / 2
      cy = ay + height / 2
      break
    case "top":
      cx = ax
      cy = ay - height / 2
      break
    case "bottom":
      cx = ax
      cy = ay + height / 2
      break
    case "left":
      cx = ax + width / 2
      cy = ay
      break
    case "right":
      cx = ax - width / 2
      cy = ay
      break
    case "center":
    default:
      // center is the default
      break
  }

  return { x: cx, y: cy }
}
