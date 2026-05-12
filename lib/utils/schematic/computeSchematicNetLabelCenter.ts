import {
  DEFAULT_SCHEMATIC_NET_LABEL_CHAR_WIDTH,
  DEFAULT_SCHEMATIC_NET_LABEL_FONT_SIZE,
  DEFAULT_SCHEMATIC_NET_LABEL_HORIZONTAL_PADDING,
  type SchematicLabelAnchorSide,
} from "./netLabelUtils"

export const getSchematicNetLabelTextWidth = ({
  text,
  font_size = DEFAULT_SCHEMATIC_NET_LABEL_FONT_SIZE,
}: {
  text: string
  font_size?: number
}) => {
  const fontScale = font_size / DEFAULT_SCHEMATIC_NET_LABEL_FONT_SIZE
  const charWidth = DEFAULT_SCHEMATIC_NET_LABEL_CHAR_WIDTH * fontScale
  const horizontalPadding =
    DEFAULT_SCHEMATIC_NET_LABEL_HORIZONTAL_PADDING * fontScale
  return text.length * charWidth + horizontalPadding
}

export const computeSchematicNetLabelCenter = ({
  anchor_position,
  anchor_side,
  text,
  font_size = DEFAULT_SCHEMATIC_NET_LABEL_FONT_SIZE,
}: {
  anchor_position: { x: number; y: number }
  anchor_side: SchematicLabelAnchorSide
  text: string
  font_size?: number
}) => {
  const width = getSchematicNetLabelTextWidth({ text, font_size })
  const height = font_size
  const center = { ...anchor_position }
  switch (anchor_side) {
    case "right":
      center.x -= width / 2
      break
    case "left":
      center.x += width / 2
      break
    case "top":
      center.y -= height / 2
      break
    case "bottom":
      center.y += height / 2
      break
  }
  return center
}
