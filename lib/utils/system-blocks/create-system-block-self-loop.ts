import type {
  Point,
  SystemBlockComponent,
  SystemBlockRoutePoint,
} from "circuit-json"
import type { SystemBlockRouteObstacle } from "./round-system-block-route"

/**
 * Replace a same-face Dagre self-loop with parallel stems and a semicircular end.
 * All points and controls are absolute page-local diagram mm (+X right, +Y up,
 * right-handed XY with +Z out of page); outward/across are unit directions.
 * Preserve attachments, labels, and the original route bounds. Return undefined
 * if the circular return cannot fit safely, allowing ordinary corner rounding.
 */
export function createSystemBlockSelfLoop(
  route: Point[],
  block: Pick<SystemBlockComponent, "center" | "width" | "height">,
  obstacles: SystemBlockRouteObstacle[],
): SystemBlockRoutePoint[] | undefined {
  const start = route[0]
  const end = route.at(-1)!
  const sides = [
    {
      axis: "x",
      position: block.center.x + block.width / 2,
      outward: { x: 1, y: 0 },
    },
    {
      axis: "x",
      position: block.center.x - block.width / 2,
      outward: { x: -1, y: 0 },
    },
    {
      axis: "y",
      position: block.center.y + block.height / 2,
      outward: { x: 0, y: 1 },
    },
    {
      axis: "y",
      position: block.center.y - block.height / 2,
      outward: { x: 0, y: -1 },
    },
  ] as const
  const side = sides.find(
    ({ axis, position }) =>
      Math.abs(start[axis] - position) < 1e-8 &&
      Math.abs(end[axis] - position) < 1e-8,
  )
  if (!side) return
  const { outward } = side
  const diameter = Math.hypot(end.x - start.x, end.y - start.y)
  if (diameter < 1e-8) return
  const radius = diameter / 2
  const across = {
    x: (end.x - start.x) / diameter,
    y: (end.y - start.y) / diameter,
  }
  const depth = Math.max(
    ...route.map(
      (point) =>
        (point.x - start.x) * outward.x + (point.y - start.y) * outward.y,
    ),
  )
  const stemLength = depth - radius
  if (stemLength <= 1e-8) return
  const first = {
    x: start.x + outward.x * stemLength,
    y: start.y + outward.y * stemLength,
  }
  const last = {
    x: end.x + outward.x * stemLength,
    y: end.y + outward.y * stemLength,
  }
  const tip = {
    x: (start.x + end.x) / 2 + outward.x * depth,
    y: (start.y + end.y) / 2 + outward.y * depth,
  }
  const handle = (4 / 3) * Math.tan(Math.PI / 8) * radius
  const rounded: SystemBlockRoutePoint[] = [
    { ...start },
    first,
    {
      ...tip,
      cubic_bezier_control_points: [
        { x: first.x + outward.x * handle, y: first.y + outward.y * handle },
        { x: tip.x - across.x * handle, y: tip.y - across.y * handle },
      ],
    },
    {
      ...last,
      cubic_bezier_control_points: [
        { x: tip.x + across.x * handle, y: tip.y + across.y * handle },
        { x: last.x + outward.x * handle, y: last.y + outward.y * handle },
      ],
    },
    { ...end },
  ]
  for (let index = 1; index < rounded.length; index++) {
    const endpoint = rounded[index]
    const controls = [
      rounded[index - 1],
      ...(endpoint.cubic_bezier_control_points ?? []),
      endpoint,
    ]
    if (obstacles.some((obstacle) => intersectsObstacle(controls, obstacle)))
      return
  }
  return rounded
}

/** Conservative Bézier subdivision against a rectangle in page-local mm. */
function intersectsObstacle(
  points: Point[],
  obstacle: SystemBlockRouteObstacle,
  depth = 0,
): boolean {
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  if (
    Math.max(...xs) <= obstacle.minX ||
    Math.min(...xs) >= obstacle.maxX ||
    Math.max(...ys) <= obstacle.minY ||
    Math.min(...ys) >= obstacle.maxY
  )
    return false
  if (
    depth === 12 ||
    points.every(
      (p) =>
        p.x > obstacle.minX &&
        p.x < obstacle.maxX &&
        p.y > obstacle.minY &&
        p.y < obstacle.maxY,
    )
  )
    return true
  // De Casteljau subdivision bounds the actual curve, allowing labels inside
  // the loop without treating its entire enclosing rectangle as occupied.
  const left = [points[0]]
  const right = [points.at(-1)!]
  let level = points
  while (level.length > 1) {
    level = level
      .slice(1)
      .map((p, i) => ({ x: (level[i].x + p.x) / 2, y: (level[i].y + p.y) / 2 }))
    left.push(level[0])
    right.unshift(level.at(-1)!)
  }
  return (
    intersectsObstacle(left, obstacle, depth + 1) ||
    intersectsObstacle(right, obstacle, depth + 1)
  )
}
