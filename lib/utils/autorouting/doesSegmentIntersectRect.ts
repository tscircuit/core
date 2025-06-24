import { doesLineIntersectLine } from "@tscircuit/math-utils"
import type { Obstacle } from "./SimpleRouteJson"

export const doesSegmentIntersectRect = (
  segment: { from: { x: number; y: number }; to: { x: number; y: number } },
  rect: Obstacle,
): boolean => {
  const halfW = rect.width / 2
  const halfH = rect.height / 2
  const left = rect.center.x - halfW
  const right = rect.center.x + halfW
  const bottom = rect.center.y - halfH
  const top = rect.center.y + halfH

  const corners = [
    { x: left, y: bottom },
    { x: right, y: bottom },
    { x: right, y: top },
    { x: left, y: top },
  ]
  for (let i = 0; i < 4; i++) {
    if (
      doesLineIntersectLine(
        [segment.from, segment.to],
        [corners[i], corners[(i + 1) % 4]],
        { lineThickness: 0 },
      )
    )
      return true
  }

  const inRect = (p: { x: number; y: number }) =>
    p.x >= left && p.x <= right && p.y >= bottom && p.y <= top

  return inRect(segment.from) || inRect(segment.to)
}
