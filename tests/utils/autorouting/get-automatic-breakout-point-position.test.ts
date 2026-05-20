import { expect, test } from "bun:test"
import { getAutomaticBreakoutPointPosition } from "lib/utils/autorouting/getAutomaticBreakoutPointPosition"
import type { Obstacle } from "lib/utils/autorouting/SimpleRouteJson"

test("automatic breakout point placement uses boundary intersection and avoids local conflicts", () => {
  const boundary = { left: -5, right: 5, bottom: -4, top: 4 }

  expect(
    getAutomaticBreakoutPointPosition({
      insidePortPosition: { x: 0, y: 0 },
      outsideTargetPosition: { x: 10, y: 2 },
      boundary,
      usedBoundaryPoints: [],
      pointClearanceConstraints: [],
      outsidePortObstacles: [],
      outsideCopperClearance: 0,
      boundaryPointSpacing: 0.5,
    }),
  ).toEqual({ x: 5, y: 1 })

  expect(
    getAutomaticBreakoutPointPosition({
      insidePortPosition: { x: 0, y: 0 },
      outsideTargetPosition: { x: 10, y: 2 },
      boundary,
      usedBoundaryPoints: [{ x: 5, y: 1 }],
      pointClearanceConstraints: [],
      outsidePortObstacles: [],
      outsideCopperClearance: 0,
      boundaryPointSpacing: 0.5,
    }),
  ).toEqual({ x: 5, y: 0.5 })

  const outsidePadObstacle: Obstacle = {
    type: "rect",
    layers: ["top"],
    center: { x: 5, y: 1 },
    width: 0.6,
    height: 0.6,
    connectedTo: ["pcb_smtpad_0"],
  }
  expect(
    getAutomaticBreakoutPointPosition({
      insidePortPosition: { x: 0, y: 0 },
      outsideTargetPosition: { x: 10, y: 2 },
      boundary,
      usedBoundaryPoints: [],
      pointClearanceConstraints: [],
      outsidePortObstacles: [outsidePadObstacle],
      outsideCopperClearance: 0.2,
      boundaryPointSpacing: 0.5,
    }),
  ).toEqual({ x: 5, y: 0 })
})
