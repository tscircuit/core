export const convertFacingDirectionToElbowDirection = (
  facingDirection: "up" | "down" | "left" | "right" | null,
): "x+" | "x-" | "y+" | "y-" | undefined => {
  switch (facingDirection) {
    case "up":
      return "y+";
    case "down":
      return "y-";
    case "left":
      return "x-";
    case "right":
      return "x+";
    default:
  }
};

export default convertFacingDirectionToElbowDirection;
