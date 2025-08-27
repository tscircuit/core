import type { AxisDirection, Side } from "./getSide"

export const oppositeSide = (input: AxisDirection | Side): Side => {
  switch (input) {
    case "x+":
      return "left"
    case "x-":
      return "right"
    case "y+":
      return "bottom"
    case "y-":
      return "top"
    case "left":
      return "right"
    case "top":
      return "bottom"
    case "right":
      return "left"
    case "bottom":
      return "top"
  }
}
