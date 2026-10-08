import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"

const pmp22650RectangularCutout = {
  type: "pcb_cutout",
  pcb_cutout_id: "pcb_cutout_altium_23",
  shape: "polygon",
  points: [
    { x: 83.58639873999999, y: 87.73279887999999 },
    { x: 108.58639953999999, y: 87.73279887999999 },
    { x: 108.58639953999999, y: 117.73279983999998 },
    { x: 83.58639873999999, y: 117.73279983999998 },
    { x: 83.58639873999999, y: 87.73279887999999 },
  ],
} as AnyCircuitElement

test("PMP22650 axis-aligned polygon cutout becomes one SRJ obstacle", () => {
  const obstacles = getObstaclesFromCircuitJson([
    {
      type: "pcb_board",
      pcb_board_id: "pcb_board_0",
      center: { x: 170.7, y: 96.59 },
      width: 200,
      height: 100,
      num_layers: 8,
      thickness: 1.6,
      material: "fr4",
    },
    pmp22650RectangularCutout,
  ])

  expect(obstacles).toHaveLength(1)
  expect(obstacles[0]).toMatchObject({
    componentId: undefined,
    type: "rect",
    layers: [
      "top",
      "inner1",
      "inner2",
      "inner3",
      "inner4",
      "inner5",
      "inner6",
      "bottom",
    ],
    connectedTo: [],
  })
  expect(obstacles[0]!.center.x).toBeCloseTo(96.08639914, 8)
  expect(obstacles[0]!.center.y).toBeCloseTo(102.73279936, 8)
  expect(obstacles[0]!.width).toBeCloseTo(25, 5)
  expect(obstacles[0]!.height).toBeCloseTo(30, 5)
})
