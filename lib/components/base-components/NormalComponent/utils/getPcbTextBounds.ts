import type { PcbSilkscreenText } from "circuit-json";

/**
 * Calculates the accurate bounding box for PCB silkscreen text based on
 * anchor position, anchor alignment, font size, and text content.
 *
 * @param text - The PCB silkscreen text element
 * @returns Bounding box with { x, y, width, height }
 */
export function getPcbTextBounds(text: PcbSilkscreenText): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const fontSize = text.font_size;
  const textWidth = text.text.length * fontSize * 0.6;
  const textHeight = fontSize;

  // Default anchor alignment if not specified
  const anchorAlignment = text.anchor_alignment || "center";

  // Calculate the actual center position based on anchor alignment
  let centerX = text.anchor_position.x;
  let centerY = text.anchor_position.y;

  // Adjust center position based on anchor alignment
  switch (anchorAlignment) {
    case "top_left":
      centerX = text.anchor_position.x + textWidth / 2;
      centerY = text.anchor_position.y + textHeight / 2;
      break;
    case "top_center":
      centerX = text.anchor_position.x;
      centerY = text.anchor_position.y + textHeight / 2;
      break;
    case "top_right":
      centerX = text.anchor_position.x - textWidth / 2;
      centerY = text.anchor_position.y + textHeight / 2;
      break;
    case "center_left":
      centerX = text.anchor_position.x + textWidth / 2;
      centerY = text.anchor_position.y;
      break;
    case "center":
      // anchor_position is already the center
      centerX = text.anchor_position.x;
      centerY = text.anchor_position.y;
      break;
    case "center_right":
      centerX = text.anchor_position.x - textWidth / 2;
      centerY = text.anchor_position.y;
      break;
    case "bottom_left":
      centerX = text.anchor_position.x + textWidth / 2;
      centerY = text.anchor_position.y - textHeight / 2;
      break;
    case "bottom_center":
      centerX = text.anchor_position.x;
      centerY = text.anchor_position.y - textHeight / 2;
      break;
    case "bottom_right":
      centerX = text.anchor_position.x - textWidth / 2;
      centerY = text.anchor_position.y - textHeight / 2;
      break;
    default:
      // Default to center if unknown alignment
      centerX = text.anchor_position.x;
      centerY = text.anchor_position.y;
      break;
  }

  // Return bounding box with top-left corner coordinates
  return {
    x: centerX - textWidth / 2,
    y: centerY - textHeight / 2,
    width: textWidth,
    height: textHeight,
  };
}
