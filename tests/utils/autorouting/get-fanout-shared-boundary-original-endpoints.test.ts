import { expect, test } from "bun:test"
import type { FanoutSolver } from "@tscircuit/fanout-solver"
import { getFanoutSharedBoundary } from "lib/utils/autorouting/get-fanout-shared-boundary"

test("fanout boundary includes original endpoint tracks on the perpendicular axis", () => {
  const preparedBuses = [
    {
      componentId: "U1",
      componentObstacles: [
        {
          componentId: "U1",
          type: "rect",
          layers: ["top"],
          center: { x: 0, y: 0 },
          width: 1,
          height: 1,
          connectedTo: ["signal"],
        },
      ],
      direction: "right",
      termination: { type: "boundary" },
      connections: [
        {
          targetPoint: { x: 10, y: 3, layer: "top" },
        },
        {
          targetPoint: { x: 10, y: -2, layer: "top" },
        },
      ],
    },
  ] as unknown as FanoutSolver["preparedBuses"]

  expect(
    getFanoutSharedBoundary({
      preparedBuses,
      padding: { right: "1mm" },
    }),
  ).toEqual({
    minX: -0.5,
    maxX: 1.5,
    minY: -2,
    maxY: 3,
  })
})
