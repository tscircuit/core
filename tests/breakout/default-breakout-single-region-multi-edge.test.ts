import { expect, test } from "bun:test"
import { defaultImplicitBreakoutPointSolverFn } from "lib/components/primitive-components/Breakout/default-implicit-breakout-point-solver"

test("single-region breakouts place connections on the nearest boundary edges", () => {
  const bounds = { minX: -10, maxX: 10, minY: -10, maxY: 10 }
  const output = defaultImplicitBreakoutPointSolverFn({
    regions: [{ regionId: "fanout", bounds, edge: "bottom" }],
    connections: [
      { connectionId: "bottom", endpoints: [{ regionId: "fanout", position: { x: 0, y: -4 } }] },
      { connectionId: "right", endpoints: [{ regionId: "fanout", position: { x: 4, y: 0 } }] },
      { connectionId: "top", endpoints: [{ regionId: "fanout", position: { x: 0, y: 4 } }] },
      { connectionId: "left", endpoints: [{ regionId: "fanout", position: { x: -4, y: 0 } }] },
    ],
    buses: [],
    boundaryPointSpacing: 0.5,
  })
  if (output instanceof Promise) {
    throw new Error("Default implicit breakout solver must be synchronous")
  }

  const pointByConnectionId = new Map(
    output.breakoutPoints.map((point) => [point.connectionId, point]),
  )
  expect(pointByConnectionId.get("bottom")?.y).toBe(bounds.minY)
  expect(pointByConnectionId.get("right")?.x).toBe(bounds.maxX)
  expect(pointByConnectionId.get("top")?.y).toBe(bounds.maxY)
  expect(pointByConnectionId.get("left")?.x).toBe(bounds.minX)
})
