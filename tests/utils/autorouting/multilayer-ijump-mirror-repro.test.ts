import { expect, test } from "bun:test"
import { MultilayerIjump } from "lib/utils/autorouting/vendor/infgrid-ijump-astar/index"

/**
 * Repro for tscircuit/core#3927 (tscircuit/autorouting#92): MultilayerIjump
 * emitted neighbors mirrored away from the goal by the full goal distance,
 * which A* expanded into wild trace jumps.
 *
 * S sits just above a long horizontal wall W whose left end is at x=-2. A
 * block F sits below W's left end (x in [-6,-1]). The right side is sealed by
 * V, so the only sane route goes around W's left end, hugs F's left face
 * (x ~ -6.15 tight, -7 with the wide margin) and then runs right to G.
 *
 * Before the fix the router emitted a neighbor at node.x - |goal.x - node.x| =
 * -8: the goal-axis "cross" distance, but in the direction AWAY from the goal.
 * That neighbor happened to be the cheapest way around F, so the final trace
 * leapt 8mm left for no geometric reason.
 */
const GOAL_X = 8

const rect = (
  name: string,
  cx: number,
  cy: number,
  w: number,
  h: number,
  layers = ["top", "bottom"],
  connectedTo: string[] = [],
) => ({
  type: "rect" as const,
  layers,
  center: { x: cx, y: cy },
  width: w,
  height: h,
  connectedTo: [name, ...connectedTo],
})

const obstacles = [
  rect("S_pad", 0, 0, 0.5, 0.5, ["top"], ["conn"]),
  rect("G_pad", GOAL_X, -8, 0.5, 0.5, ["top"], ["conn"]),
  // W: x in [-2, GOAL_X + 30], y in [-1.1, -0.9]
  rect("W", (GOAL_X + 30 - 2) / 2, -1, GOAL_X + 30 + 2, 0.2),
  // F: x in [-6, -1], y in [-6, -1.3]
  rect("F", -3.5, -3.65, 5, 4.7),
  // V: seals the right side, x = GOAL_X + 3, y in [-10.5, 2.5]
  rect("V", GOAL_X + 3, -4, 0.2, 13),
]

const input = {
  layerCount: 2,
  minTraceWidth: 0.1,
  bounds: { minX: -12, maxX: GOAL_X + 4, minY: -11, maxY: 3 },
  obstacles,
  connections: [
    {
      name: "conn",
      pointsToConnect: [
        { x: 0, y: 0, layer: "top" },
        { x: GOAL_X, y: -8, layer: "top" },
      ],
    },
  ],
}

// F's left face is x=-6; the widest berth the router is allowed is
// largestMargin (1) + OBSTACLE_MARGIN (0.15). Anything further left than that
// is a jump the geometry does not call for.
const F_LEFT = -6
const WIDEST_BERTH = 1 + 0.15

test("repro 3927: trace hugs the block instead of leaping to the mirrored goal distance", () => {
  const autorouter = new MultilayerIjump({ input })
  const solution = autorouter.solveAndMapToTraces()

  expect(solution).toHaveLength(1)
  const xs = solution[0].route
    .filter((p) => p.route_type === "wire")
    .map((p) => p.x)
  expect(Math.min(...xs)).toBeGreaterThanOrEqual(F_LEFT - WIDEST_BERTH - 1e-6)
})

test("repro 3927: getNeighbors never emits a node outside the problem bounds", () => {
  const seen: Array<{ from: any; to: any }> = []
  class Recording extends MultilayerIjump {
    getNeighbors(node: any) {
      const neighbors = super.getNeighbors(node)
      for (const n of neighbors) seen.push({ from: node, to: n })
      return neighbors
    }
  }
  const autorouter = new Recording({ input })
  autorouter.solveAndMapToTraces()

  const { minX, maxX, minY, maxY } = input.bounds
  const tol = WIDEST_BERTH + 1e-6
  const escaped = seen.filter(
    ({ to }) =>
      to.x < minX - tol ||
      to.x > maxX + tol ||
      to.y < minY - tol ||
      to.y > maxY + tol,
  )
  expect(seen.length).toBeGreaterThan(0)
  expect(
    escaped.map(
      ({ from, to }) =>
        `(${from.x.toFixed(2)},${from.y.toFixed(2)}) -> (${to.x.toFixed(2)},${to.y.toFixed(2)})`,
    ),
  ).toEqual([])
})
