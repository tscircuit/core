export interface ElbowPoint {
  x: number
  y: number
  facingDirection?: "x+" | "x-" | "y+" | "y-"
}

export const patchElbowInsideAngles = (
  path: Array<{ x: number; y: number }>,
  start: ElbowPoint,
  end: ElbowPoint,
): Array<{ x: number; y: number }> => {
  if (
    start.facingDirection === "x+" &&
    end.facingDirection === "y+" &&
    start.x < end.x &&
    start.y > end.y
  ) {
    return [
      { x: start.x, y: start.y },
      { x: start.x, y: end.y },
      { x: end.x, y: end.y },
    ]
  }
  if (
    start.facingDirection === "x-" &&
    end.facingDirection === "y+" &&
    start.x > end.x &&
    start.y > end.y
  ) {
    return [
      { x: start.x, y: start.y },
      { x: start.x, y: end.y },
      { x: end.x, y: end.y },
    ]
  }
  if (
    start.facingDirection === "x+" &&
    end.facingDirection === "y-" &&
    start.x < end.x &&
    start.y < end.y
  ) {
    return [
      { x: start.x, y: start.y },
      { x: start.x, y: end.y },
      { x: end.x, y: end.y },
    ]
  }
  if (
    start.facingDirection === "x-" &&
    end.facingDirection === "y-" &&
    start.x > end.x &&
    start.y < end.y
  ) {
    return [
      { x: start.x, y: start.y },
      { x: start.x, y: end.y },
      { x: end.x, y: end.y },
    ]
  }
  return path
}
