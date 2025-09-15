export const computeSchematicNetLabelCenter = ({
  anchor_position,
  anchor_side,
  text,
  font_size = 0.18,
}: {
  anchor_position: { x: number; y: number };
  anchor_side: "top" | "bottom" | "left" | "right";
  text: string;
  font_size?: number;
}) => {
  const charWidth = 0.1 * (font_size / 0.18);
  const width = text.length * charWidth;
  const height = font_size;
  const center = { ...anchor_position };
  switch (anchor_side) {
    case "right":
      center.x -= width / 2;
      break;
    case "left":
      center.x += width / 2;
      break;
    case "top":
      center.y -= height / 2;
      break;
    case "bottom":
      center.y += height / 2;
      break;
  }
  return center;
};
