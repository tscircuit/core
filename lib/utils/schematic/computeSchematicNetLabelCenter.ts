export const getSchematicNetLabelTextWidth = ({
  text,
  font_size = 0.18,
}: {
  text: string
  font_size?: number
}) => {
  // Linear fit of the rendered net label box (text + arrow ends + padding):
  // the ends are a constant cost, only ~0.08 per character grows with text
  const fontScale = font_size / 0.18
  const charWidth = 0.08 * fontScale
  const endPadding = 0.3 * fontScale
  return text.length * charWidth + endPadding
}

export const computeSchematicNetLabelCenter = ({
  anchor_position,
  anchor_side,
  text,
  font_size = 0.18,
}: {
  anchor_position: { x: number; y: number }
  anchor_side: "top" | "bottom" | "left" | "right"
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
