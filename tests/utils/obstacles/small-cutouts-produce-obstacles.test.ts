import { test, expect } from "bun:test"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"

test("small cutouts still produce routing obstacles (#3734)", () => {
  const polygonObstacles = getObstaclesFromCircuitJson([
    {
      type: "pcb_cutout",
      pcb_cutout_id: "thin-slot",
      shape: "polygon",
      points: [
        { x: 0, y: 0 },
        { x: 2, y: 0 },
        { x: 2, y: 0.2 },
        { x: 0, y: 0.2 },
      ],
    } as any,
  ])
  expect(polygonObstacles.length).toBeGreaterThan(0)
  expect(polygonObstacles[0].center).toEqual({ x: 1, y: 0.1 })
  expect(polygonObstacles[0].connectedTo).toEqual([])

  const circleObstacles = getObstaclesFromCircuitJson([
    {
      type: "pcb_cutout",
      pcb_cutout_id: "small-circle",
      shape: "circle",
      center: { x: 0, y: 0 },
      radius: 0.1,
    } as any,
  ])
  expect(circleObstacles.length).toBeGreaterThan(0)
  expect(circleObstacles[0].center).toEqual({ x: 0, y: 0 })
})
