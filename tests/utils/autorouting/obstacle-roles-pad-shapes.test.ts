import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"

test("all PCB pad shapes emit pad-role obstacles", () => {
  const smtPads = [
    {
      type: "pcb_smtpad",
      shape: "circle",
      radius: 0.5,
    },
    {
      type: "pcb_smtpad",
      shape: "rect",
      width: 1,
      height: 0.5,
    },
    {
      type: "pcb_smtpad",
      shape: "rotated_rect",
      width: 1,
      height: 0.5,
      ccw_rotation: 45,
    },
    {
      type: "pcb_smtpad",
      shape: "pill",
      width: 1,
      height: 0.5,
    },
    {
      type: "pcb_smtpad",
      shape: "rotated_pill",
      width: 1,
      height: 0.5,
      ccw_rotation: 45,
    },
    {
      type: "pcb_smtpad",
      shape: "polygon",
      points: [
        { x: -0.5, y: -0.5 },
        { x: 0.5, y: -0.5 },
        { x: 0.5, y: 0.5 },
        { x: -0.5, y: 0.5 },
      ],
    },
    {
      type: "pcb_smtpad",
      shape: "polygon",
      points: [
        { x: 0, y: -0.6 },
        { x: 0.6, y: 0 },
        { x: 0, y: 0.6 },
        { x: -0.6, y: 0 },
      ],
    },
  ].map((pad, padIndex) => ({
    ...pad,
    pcb_smtpad_id: `pcb_smtpad_${padIndex}`,
    pcb_component_id: "pcb_component_0",
    x: padIndex * 2,
    y: 0,
    layer: "top",
  }))
  const platedHoles = [
    {
      type: "pcb_plated_hole",
      shape: "circle",
      outer_diameter: 1,
      hole_diameter: 0.5,
    },
    {
      type: "pcb_plated_hole",
      shape: "circular_hole_with_rect_pad",
      hole_diameter: 0.5,
      rect_pad_width: 1,
      rect_pad_height: 0.8,
    },
    {
      type: "pcb_plated_hole",
      shape: "oval",
      outer_width: 1.2,
      outer_height: 0.8,
      hole_width: 0.6,
      hole_height: 0.4,
    },
    {
      type: "pcb_plated_hole",
      shape: "pill",
      outer_width: 1.2,
      outer_height: 0.8,
      hole_width: 0.6,
      hole_height: 0.4,
      ccw_rotation: 30,
    },
    {
      type: "pcb_plated_hole",
      shape: "hole_with_polygon_pad",
      hole_shape: "circle",
      hole_diameter: 0.5,
      pad_outline: [
        { x: -0.5, y: -0.4 },
        { x: 0.5, y: -0.4 },
        { x: 0.5, y: 0.4 },
        { x: -0.5, y: 0.4 },
      ],
    },
  ].map((pad, padIndex) => ({
    ...pad,
    pcb_plated_hole_id: `pcb_plated_hole_${padIndex}`,
    pcb_component_id: "pcb_component_0",
    x: padIndex * 2,
    y: 3,
    layers: ["top", "bottom"],
  }))
  const circuitJson = [
    ...smtPads,
    ...platedHoles,
  ] as unknown as AnyCircuitElement[]

  const obstacles = getObstaclesFromCircuitJson(circuitJson)
  const padIds = [
    ...smtPads.map((pad) => pad.pcb_smtpad_id),
    ...platedHoles.map((pad) => pad.pcb_plated_hole_id),
  ]

  for (const padId of padIds) {
    const padObstacles = obstacles.filter((obstacle) =>
      obstacle.connectedTo.includes(padId),
    )
    expect(padObstacles.length).toBeGreaterThan(0)
    expect(
      padObstacles.every(({ obstacleRole }) => obstacleRole === "pad"),
    ).toBe(true)
  }
})
