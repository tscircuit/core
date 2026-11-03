import type { SimplifiedPcbTrace } from "@tscircuit/capacity-autorouter"

/** Remove redundant vertices without changing widths, corners or layer changes. */
export function simplifyCopperRoute(
  route: SimplifiedPcbTrace["route"],
): SimplifiedPcbTrace["route"] {
  const result: SimplifiedPcbTrace["route"] = []
  for (const point of route) {
    const previous = result.at(-1)
    const before = result.at(-2)
    if (
      point.route_type === "wire" &&
      previous?.route_type === "wire" &&
      point.layer === previous.layer &&
      point.width === previous.width
    ) {
      if (Math.hypot(point.x - previous.x, point.y - previous.y) < 0.00000001) {
        result[result.length - 1] = { ...previous, ...point }
        continue
      }
      if (
        before?.route_type === "wire" &&
        before.layer === point.layer &&
        before.width === point.width
      ) {
        const first = { x: previous.x - before.x, y: previous.y - before.y }
        const second = { x: point.x - previous.x, y: point.y - previous.y }
        if (
          Math.abs(first.x * second.y - first.y * second.x) < 0.000000001 &&
          first.x * second.x + first.y * second.y >= 0
        ) {
          result[result.length - 1] = point
          continue
        }
      }
    }
    result.push(point)
  }
  return result
}
