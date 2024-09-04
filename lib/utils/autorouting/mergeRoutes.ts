import type { PCBTrace } from "@tscircuit/soup"

function pdist(a: any, b: any) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

/**
 * Merge multiple routes into a single route.
 *
 * If the end of the next route is closer to the end of the previous route,
 * reverse the next route and append it to the previous route.
 */
export const mergeRoutes = (routes: PCBTrace["route"][]) => {
  if (routes.length === 1) return routes[0]
  // routes = routes.filter((route) => route.length > 0)
  if (routes.some((r) => r.length === 0)) {
    throw new Error("Cannot merge routes with zero length")
  }
  // for (const route of routes) {
  //   console.table(route)
  // }
  const merged: PCBTrace["route"] = []
  // const reverse_log: boolean[] = []

  // Determine if the first route should be reversed
  const first_route_fp = routes[0][0]
  const first_route_lp = routes[0][routes[0].length - 1]

  const second_route_fp = routes[1][0]
  const second_route_lp = routes[1][routes[1].length - 1]

  const best_reverse_dist = Math.min(
    pdist(first_route_fp, second_route_fp),
    pdist(first_route_fp, second_route_lp),
  )

  const best_normal_dist = Math.min(
    pdist(first_route_lp, second_route_fp),
    pdist(first_route_lp, second_route_lp),
  )

  if (best_reverse_dist < best_normal_dist) {
    merged.push(...routes[0].reverse())
    // reverse_log.push(true)
  } else {
    merged.push(...routes[0])
    // reverse_log.push(false)
  }

  for (let i = 1; i < routes.length; i++) {
    const last_merged_point = merged[merged.length - 1]
    const next_route = routes[i]

    const next_first_point = next_route[0]
    const next_last_point = next_route[next_route.length - 1]

    const distance_to_first = pdist(last_merged_point, next_first_point)
    const distance_to_last = pdist(last_merged_point, next_last_point)

    if (distance_to_first < distance_to_last) {
      // reverse_log.push(false)
      merged.push(...next_route)
    } else {
      // reverse_log.push(true)
      merged.push(...next_route.reverse())
    }
  }
  // console.log(reverse_log)
  // console.table(merged)
  return merged
}
