import type { Point } from "circuit-json"

/** Evaluate polylines in page-centered diagram mm (+X right, +Y up). */
export function measureSystemRouteQuality(routes: readonly Point[][]) {
  let crossings = 0
  let sharedLength = 0
  let closeParallelLength = 0
  let length = 0
  let bends = 0
  const segments = routes.map((route) =>
    route.slice(1).map((end, index) => {
      const start = route[index]
      length += Math.abs(end.x - start.x) + Math.abs(end.y - start.y)
      return { start, end, horizontal: start.y === end.y }
    }),
  )
  for (const route of routes) bends += Math.max(0, route.length - 2)
  for (let i = 0; i < segments.length; i++) {
    for (let j = i + 1; j < segments.length; j++) {
      const intersections = new Set<string>()
      for (const a of segments[i])
        for (const b of segments[j]) {
          if (a.horizontal === b.horizontal) {
            const along = a.horizontal ? "x" : "y"
            const across = a.horizontal ? "y" : "x"
            const overlap =
              Math.min(
                Math.max(a.start[along], a.end[along]),
                Math.max(b.start[along], b.end[along]),
              ) -
              Math.max(
                Math.min(a.start[along], a.end[along]),
                Math.min(b.start[along], b.end[along]),
              )
            if (overlap <= 1e-6) continue
            const separation = Math.abs(a.start[across] - b.start[across])
            if (separation < 1e-6) sharedLength += overlap
            if (separation < 3 - 1e-6)
              closeParallelLength += (overlap * (3 - separation)) / 3
          } else {
            const h = a.horizontal ? a : b,
              v = a.horizontal ? b : a
            const x = v.start.x,
              y = h.start.y
            if (
              x >= Math.min(h.start.x, h.end.x) - 1e-6 &&
              x <= Math.max(h.start.x, h.end.x) + 1e-6 &&
              y >= Math.min(v.start.y, v.end.y) - 1e-6 &&
              y <= Math.max(v.start.y, v.end.y) + 1e-6
            ) {
              intersections.add(`${x.toFixed(6)},${y.toFixed(6)}`)
            }
          }
        }
      crossings += intersections.size
    }
  }
  return {
    crossings,
    sharedLength,
    closeParallelLength,
    bends,
    length,
    score:
      crossings * 200 +
      sharedLength * 100 +
      closeParallelLength * 10 +
      bends * 3 +
      length * 0.05,
  }
}
