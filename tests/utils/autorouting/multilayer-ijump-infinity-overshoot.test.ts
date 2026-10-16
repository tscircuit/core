import { expect, test } from "bun:test"
import { MultilayerIjump } from "lib/utils/autorouting/MultilayerIjump"

const GOAL_X = 8

const rect = (
  name: string,
  cx: number,
  cy: number,
  w: number,
  h: number,
  layers: ("top" | "bottom")[] = ["top", "bottom"],
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
  // Horizontal wall W with left end at x = -2
  rect("W", (GOAL_X + 30 - 2) / 2, -1, GOAL_X + 30 + 2, 0.2),
  // Block F below W's left end (x in [-6, -1], y in [-6, -1.3])
  rect("F", -3.5, -3.65, 5, 4.7),
  // Vertical wall V sealing the right side
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
        { x: 0, y: 0, layer: "top" as const },
        { x: GOAL_X, y: -8, layer: "top" as const },
      ],
    },
  ],
}

const F_LEFT = -6
const WIDEST_BERTH = 1 + 0.15

test("MultilayerIjump does not overshoot into open space away from goal when wallDistance === Infinity (#4585)", () => {
  const autorouter = new MultilayerIjump({ input: input as any })
  const solution = autorouter.solveAndMapToTraces()

  expect(solution).toHaveLength(1)
  const xs = solution[0].route
    .filter((p) => p.route_type === "wire")
    .map((p) => p.x)
  expect(Math.min(...xs)).toBeGreaterThanOrEqual(F_LEFT - WIDEST_BERTH - 1e-6)
})

test("MultilayerIjump.getNeighbors omits unguarded goalDistAlongTravelDir jumps when goal is behind travelDir (#4585)", () => {
  const seen: Array<{ from: any; to: any }> = []
  class RecordingMultilayerIjump extends MultilayerIjump {
    override getNeighbors(node: any) {
      const neighbors = super.getNeighbors(node)
      for (const n of neighbors) seen.push({ from: node, to: n })
      return neighbors
    }
  }

  const autorouter = new RecordingMultilayerIjump({ input: input as any })
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
  expect(escaped).toEqual([])
})
