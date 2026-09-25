import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"

test("all NPTH shapes carry hole identity and physical geometry across every copper layer", () => {
  const holes = ["circle", "square", "rect", "oval", "pill", "rotated_pill"].map((hole_shape, index) => ({
    type: "pcb_hole", pcb_hole_id: `mechanical_${index}`, hole_shape,
    x: index * 5, y: 2, hole_diameter: 2, hole_width: 2, hole_height: 3,
    ccw_rotation: 35,
  }))
  const obstacles = getObstaclesFromCircuitJson([
    { type: "pcb_board", pcb_board_id: "board", center: { x: 0, y: 0 }, num_layers: 4 },
    ...holes,
    { type: "pcb_cutout", pcb_cutout_id: "cutout", shape: "rect", center: { x: 40, y: 0 }, width: 1, height: 1 },
    { type: "pcb_plated_hole", pcb_plated_hole_id: "plated", shape: "circle", x: 45, y: 0, hole_diameter: 1, outer_diameter: 2, layers: ["top", "bottom"] },
  ] as AnyCircuitElement[])
  expect(obstacles.filter((o) => o.isHole)).toHaveLength(holes.length)
  for (const hole of holes) {
    const obstacle = obstacles.find((o) => o.obstacleId === hole.pcb_hole_id)!
    expect(obstacle).toMatchObject({
      type: "rect", isHole: true, center: { x: hole.x, y: hole.y },
      layers: ["top", "inner1", "inner2", "bottom"], connectedTo: [], width: 2,
      height: ["circle", "square"].includes(hole.hole_shape) ? 2 : 3,
    })
    expect(obstacle.shape).toBe(hole.hole_shape === "circle" ? "circle" : undefined)
    expect(obstacle.ccwRotationDegrees).toBe(hole.hole_shape === "rotated_pill" ? 35 : undefined)
  }
  expect(obstacles.filter((o) => o.center.x >= 40).every((o) => !o.isHole)).toBe(true)
})
