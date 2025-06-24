export const convertFacingDirectionToXYFacingDirection = (
  dir: "up" | "down" | "left" | "right" | null,
): "x+" | "x-" | "y+" | "y-" | undefined => {
  switch (dir) {
    case "up":
      return "y+"
    case "down":
      return "y-"
    case "left":
      return "x-"
    case "right":
      return "x+"
  }
  return undefined
}
