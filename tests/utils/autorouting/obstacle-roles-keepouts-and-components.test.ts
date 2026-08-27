import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"

test("explicit keepouts are tagged without mislabeling component-owned pads", () => {
  const circuitJson = [
    {
      type: "pcb_component",
      pcb_component_id: "pcb_component_0",
      source_component_id: "source_component_0",
      center: { x: 0, y: 0 },
      width: 10,
      height: 8,
      layer: "top",
      rotation: 0,
    },
    {
      type: "pcb_smtpad",
      shape: "rect",
      pcb_smtpad_id: "pcb_smtpad_0",
      pcb_component_id: "pcb_component_0",
      x: 0,
      y: 0,
      width: 1,
      height: 0.5,
      layer: "top",
    },
    {
      type: "pcb_keepout",
      shape: "circle",
      pcb_keepout_id: "pcb_keepout_0",
      pcb_component_id: "pcb_component_0",
      center: { x: 2, y: 0 },
      radius: 0.5,
      layers: ["top"],
    },
    {
      type: "pcb_keepout",
      shape: "rect",
      pcb_keepout_id: "pcb_keepout_1",
      center: { x: 4, y: 0 },
      width: 1,
      height: 1,
      layers: ["bottom"],
    },
    {
      type: "pcb_cutout",
      shape: "rect",
      pcb_cutout_id: "pcb_cutout_0",
      center: { x: 6, y: 0 },
      width: 1,
      height: 1,
    },
    {
      type: "pcb_cutout",
      shape: "circle",
      pcb_cutout_id: "pcb_cutout_1",
      center: { x: 8, y: 0 },
      radius: 0.5,
    },
    {
      type: "pcb_cutout",
      shape: "polygon",
      pcb_cutout_id: "pcb_cutout_2",
      points: [
        { x: 9, y: -0.5 },
        { x: 10, y: -0.5 },
        { x: 10, y: 0.5 },
        { x: 9, y: 0.5 },
      ],
    },
  ] as unknown as AnyCircuitElement[]

  const obstacles = getObstaclesFromCircuitJson(circuitJson)
  const [padObstacle] = obstacles.filter((obstacle) =>
    obstacle.connectedTo.includes("pcb_smtpad_0"),
  )
  const keepoutObstacles = obstacles.filter(
    ({ obstacleRole }) => obstacleRole === "keepout",
  )
  const explicitKeepoutRegions = [
    { minX: 1, maxX: 3 },
    { minX: 3, maxX: 5 },
    { minX: 5, maxX: 7 },
    { minX: 7, maxX: 9 },
    { minX: 9, maxX: 10 },
  ]

  expect(padObstacle).toMatchObject({
    componentId: "pcb_component_0",
    obstacleRole: "pad",
  })
  for (const { minX, maxX } of explicitKeepoutRegions) {
    const regionObstacles = obstacles.filter(
      ({ center }) => center.x >= minX && center.x <= maxX,
    )
    expect(regionObstacles.length).toBeGreaterThan(0)
    expect(
      regionObstacles.every(({ obstacleRole }) => obstacleRole === "keepout"),
    ).toBe(true)
  }
  expect(keepoutObstacles).toHaveLength(obstacles.length - 1)
  expect(
    obstacles.some(({ obstacleRole }) => obstacleRole === "component_body"),
  ).toBe(false)
})
