import type { NinePointAnchor } from "circuit-json";
export function getTitleAnchorAndPosition({
  anchor,
  x,
  y,
  width,
  height,
  isInside,
}: {
  anchor: NinePointAnchor;
  x: number;
  y: number;
  width: number;
  height: number;
  isInside: boolean;
}): {
  x: number;
  y: number;
  textAnchor: NinePointAnchor;
} {
  switch (anchor) {
    case "top_left":
      return {
        x,
        y: y + height,
        textAnchor: isInside ? "top_left" : "bottom_left",
      };
    case "top_center":
      return {
        x: x + width / 2,
        y: y + height,
        textAnchor: isInside ? "top_center" : "bottom_center",
      };
    case "top_right":
      return {
        x: x + width,
        y: y + height,
        textAnchor: isInside ? "top_right" : "bottom_right",
      };
    case "center_left":
      return {
        x,
        y: y + height / 2,
        textAnchor: isInside ? "center_left" : "center_right",
      };
    case "center":
      return {
        x: x + width / 2,
        y: y + height / 2,
        textAnchor: "center",
      };
    case "center_right":
      return {
        x: x + width,
        y: y + height / 2,
        textAnchor: isInside ? "center_right" : "center_left",
      };
    case "bottom_left":
      return {
        x,
        y,
        textAnchor: isInside ? "bottom_left" : "top_left",
      };
    case "bottom_center":
      return {
        x: x + width / 2,
        y,
        textAnchor: isInside ? "bottom_center" : "top_center",
      };
    case "bottom_right":
      return {
        x: x + width,
        y,
        textAnchor: isInside ? "bottom_right" : "top_right",
      };
    default:
      return {
        x: x + width / 2,
        y: y + height,
        textAnchor: "center",
      };
  }
}
