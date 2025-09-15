export const projectPointInDirection = (
  point: { x: number; y: number },
  direction: "up" | "down" | "left" | "right",
  distance: number,
) => {
  switch (direction) {
    case "up":
      return { x: point.x, y: point.y + distance };
    case "down":
      return { x: point.x, y: point.y - distance };
    case "left":
      return { x: point.x + distance, y: point.y };
    case "right":
      return { x: point.x - distance, y: point.y };
    default:
      throw new Error(`Unknown direction "${direction}"`);
  }
};
