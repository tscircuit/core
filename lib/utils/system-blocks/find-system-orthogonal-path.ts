import type { Point } from "circuit-json"

/** Rectangle extents in page-centered diagram mm: +X right, +Y up. */
export interface SystemRoutingObstacle {
  left: number
  right: number
  bottom: number
  top: number
}

/** Both endpoints and obstacles are in page-centered mm (+X right, +Y up). */
export function findSystemOrthogonalPath(
  start: Point,
  end: Point,
  obstacles: SystemRoutingObstacle[],
  routedSegments: [Point, Point][],
): Point[] | undefined {
  const xs = [
    ...new Set([
      start.x,
      end.x,
      ...obstacles.flatMap((r) => [r.left, r.right]),
      ...routedSegments
        .filter(([a, b]) => a.x === b.x)
        .flatMap(([a]) => [a.x - 3, a.x + 3]),
    ]),
  ].sort((a, b) => a - b)
  const ys = [
    ...new Set([
      start.y,
      end.y,
      ...obstacles.flatMap((r) => [r.bottom, r.top]),
      ...routedSegments
        .filter(([a, b]) => a.y === b.y)
        .flatMap(([a]) => [a.y - 3, a.y + 3]),
    ]),
  ].sort((a, b) => a - b)
  xs.unshift(xs[0] - 5)
  xs.push(xs.at(-1)! + 5)
  ys.unshift(ys[0] - 5)
  ys.push(ys.at(-1)! + 5)
  const columns = xs.length
  const pointAt = (node: number): Point => ({
    x: xs[node % columns],
    y: ys[Math.floor(node / columns)],
  })
  const startNode = ys.indexOf(start.y) * columns + xs.indexOf(start.x)
  const endNode = ys.indexOf(end.y) * columns + xs.indexOf(end.x)
  // Three states per vertex: incoming horizontal, vertical, or initial heading.
  const costs = new Float64Array(xs.length * ys.length * 3).fill(Infinity)
  const previous = new Int32Array(costs.length).fill(-1)
  // Multiple incoming headings revisit the same undirected grid edge. Cache its
  // obstacle/congestion cost; only the bend cost depends on the search state.
  const horizontalCosts = new Float64Array(xs.length * ys.length).fill(NaN)
  const verticalCosts = new Float64Array(horizontalCosts.length).fill(NaN)
  const queue: { state: number; cost: number; priority: number }[] = []
  const enqueue = (state: number, cost: number, priority: number) => {
    const entry = { state, cost, priority }
    queue.push(entry)
    let i = queue.length - 1
    while (i > 0) {
      const parent = (i - 1) >> 1
      if (queue[parent].priority <= priority) break
      queue[i] = queue[parent]
      i = parent
    }
    queue[i] = entry
  }
  costs[startNode * 3 + 2] = 0
  enqueue(startNode * 3 + 2, 0, 0)
  while (queue.length) {
    const current = queue[0]
    const last = queue.pop()!
    if (queue.length) {
      let i = 0
      while (2 * i + 1 < queue.length) {
        let child = 2 * i + 1
        if (
          child + 1 < queue.length &&
          queue[child + 1].priority < queue[child].priority
        )
          child++
        if (last.priority <= queue[child].priority) break
        queue[i] = queue[child]
        i = child
      }
      queue[i] = last
    }
    if (current.cost !== costs[current.state]) continue
    const node = Math.floor(current.state / 3)
    if (node === endNode) {
      const path: Point[] = []
      for (let state = current.state; state !== -1; state = previous[state])
        path.push(pointAt(Math.floor(state / 3)))
      return path.reverse()
    }
    const from = pointAt(node)
    const col = node % columns
    const row = Math.floor(node / columns)
    const neighbors = [
      ...(col > 0 ? [node - 1] : []),
      ...(col + 1 < columns ? [node + 1] : []),
      ...(row > 0 ? [node - columns] : []),
      ...(row + 1 < ys.length ? [node + columns] : []),
    ]
    for (const neighbor of neighbors) {
      const to = pointAt(neighbor)
      const horizontal = from.y === to.y
      const left = Math.min(from.x, to.x),
        right = Math.max(from.x, to.x)
      const bottom = Math.min(from.y, to.y),
        top = Math.max(from.y, to.y)
      const edgeCosts = horizontal ? horizontalCosts : verticalCosts
      const edgeIndex = Math.min(node, neighbor)
      let travelCost = edgeCosts[edgeIndex]
      if (Number.isNaN(travelCost)) {
        if (
          obstacles.some((r) =>
            horizontal
              ? from.y > r.bottom + 1e-6 &&
                from.y < r.top - 1e-6 &&
                right > r.left + 1e-6 &&
                left < r.right - 1e-6
              : from.x > r.left + 1e-6 &&
                from.x < r.right - 1e-6 &&
                top > r.bottom + 1e-6 &&
                bottom < r.top - 1e-6,
          )
        ) {
          edgeCosts[edgeIndex] = Infinity
          continue
        }
        let congestion = 0
        for (const [a, b] of routedSegments) {
          const sameAxis = (a.y === b.y) === horizontal
          if (sameAxis) {
            const separation = horizontal
              ? Math.abs(a.y - from.y)
              : Math.abs(a.x - from.x)
            if (horizontal && separation < 3)
              congestion +=
                Math.max(
                  0,
                  Math.min(right, Math.max(a.x, b.x)) -
                    Math.max(left, Math.min(a.x, b.x)),
                ) * (separation < 1e-6 ? 40 : (3 - separation) * 8)
            if (!horizontal && separation < 3)
              congestion +=
                Math.max(
                  0,
                  Math.min(top, Math.max(a.y, b.y)) -
                    Math.max(bottom, Math.min(a.y, b.y)),
                ) * (separation < 1e-6 ? 40 : (3 - separation) * 8)
          } else if (
            horizontal
              ? a.x >= left &&
                a.x <= right &&
                from.y >= Math.min(a.y, b.y) &&
                from.y <= Math.max(a.y, b.y)
              : a.y >= bottom &&
                a.y <= top &&
                from.x >= Math.min(a.x, b.x) &&
                from.x <= Math.max(a.x, b.x)
          )
            congestion += 80
        }
        travelCost = right - left + top - bottom + congestion
        edgeCosts[edgeIndex] = travelCost
      }
      if (travelCost === Infinity) continue
      const axis = horizontal ? 0 : 1
      const state = neighbor * 3 + axis
      const bend = current.state % 3 === 2 || current.state % 3 === axis ? 0 : 6
      const cost = current.cost + travelCost + bend
      if (cost >= costs[state]) continue
      costs[state] = cost
      previous[state] = current.state
      enqueue(
        state,
        cost,
        cost + Math.abs(to.x - end.x) + Math.abs(to.y - end.y),
      )
    }
  }
}
