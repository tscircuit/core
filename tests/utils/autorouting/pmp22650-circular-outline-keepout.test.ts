import { expect, test } from "bun:test"
import type { PcbKeepoutOutline } from "circuit-json"
import { getObstaclesFromPcbKeepoutOutline } from "lib/utils/obstacles/getObstaclesFromPcbKeepoutOutline"

const pmp22650CircularCenterline = Array.from(
  { length: 48 },
  (_, outlinePointIndex) => {
    const angleRadians = (outlinePointIndex * 2 * Math.PI) / 48
    return {
      x: 209.30981506 + 0.254 * Math.cos(angleRadians),
      y: 47.27681172 + 0.254 * Math.sin(angleRadians),
    }
  },
)

const pmp22650Keepout: PcbKeepoutOutline = {
  type: "pcb_keepout",
  pcb_keepout_id: "pcb_keepout_altium_arc_4291",
  shape: "outline",
  outline: [...pmp22650CircularCenterline, pmp22650CircularCenterline[0]!],
  stroke_width: 0.0254,
  layers: ["top"],
}

// Reduced from PMP22650's pcb_keepout_altium_arc_4291. Altium full-circle
// keepout arcs arrive as densely sampled stroked outlines.
test("PMP22650 circular outline keepout becomes one SRJ rect", () => {
  const obstacles = getObstaclesFromPcbKeepoutOutline(pmp22650Keepout)

  expect(obstacles).toHaveLength(1)
  expect(obstacles[0]).toMatchObject({
    obstacleId: "pcb_keepout_altium_arc_4291",
    componentId: undefined,
    type: "rect",
    layers: ["top"],
    center: { x: 209.30981506, y: 47.27681172 },
    connectedTo: [],
  })
  expect(obstacles[0]!.width).toBeCloseTo(0.5334, 10)
  expect(obstacles[0]!.height).toBeCloseTo(0.5334, 10)
})
