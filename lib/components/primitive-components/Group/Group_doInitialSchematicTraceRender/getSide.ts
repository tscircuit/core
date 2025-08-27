export type Side = "left" | "top" | "right" | "bottom"
export type AxisDirection = "x+" | "x-" | "y+" | "y-"
export const getSide = (input: AxisDirection | Side): Side => {
  switch (input) {
    case "x+":
      return "right"
    case "x-":
      return "left"
    case "y+":
      return "top"
    case "y-":
      return "bottom"
    case "left":
      return "left"
    case "top":
      return "top"
    case "right":
      return "right"
    case "bottom":
      return "bottom"
  }
}
