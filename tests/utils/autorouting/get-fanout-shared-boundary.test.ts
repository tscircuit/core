import { expect, test } from "bun:test"
import type { FanoutSolver } from "@tscircuit/fanout-solver"
import { getFanoutSharedBoundary } from "lib/utils/autorouting/get-fanout-shared-boundary"

type FanoutSourceObstacle =
  FanoutSolver["preparedBuses"][number]["componentObstacles"][number]

const createObstacle = ({
  componentId,
  x,
  y,
  width,
  height,
  connected = true,
  ccwRotationDegrees,
}: {
  componentId: string
  x: number
  y: number
  width: number
  height: number
  connected?: boolean
  ccwRotationDegrees?: number
}): FanoutSourceObstacle => ({
  componentId,
  type: "rect",
  layers: ["top"],
  center: { x, y },
  width,
  height,
  connectedTo: connected ? [`pad:${componentId}:${x}:${y}`] : [],
  ccwRotationDegrees,
})

test("fanout padding wraps the shared source-pad union", () => {
  const u1Pads = [
    createObstacle({
      componentId: "U1",
      x: -2,
      y: 0,
      width: 1,
      height: 1,
    }),
    createObstacle({
      componentId: "U1",
      x: -100,
      y: 0,
      width: 1,
      height: 1,
      connected: false,
    }),
  ]
  const u2Pads = [
    createObstacle({
      componentId: "U2",
      x: 3,
      y: 1,
      width: 2,
      height: 1,
      ccwRotationDegrees: 90,
    }),
  ]
  const preparedBuses = [
    { componentId: "U1", componentObstacles: u1Pads },
    { componentId: "U1", componentObstacles: u1Pads },
    { componentId: "U2", componentObstacles: u2Pads },
  ] as FanoutSolver["preparedBuses"]

  expect(
    getFanoutSharedBoundary({
      preparedBuses,
      padding: {
        left: "0.4mm",
        right: "0.6mm",
        top: "0.8mm",
        bottom: "1mm",
      },
    }),
  ).toEqual({
    minX: -2.9,
    maxX: 4.1,
    minY: -1.5,
    maxY: 2.8,
  })
})
