import { expect, test } from "bun:test"
import type { PcbKeepoutOutline } from "circuit-json"
import { getObstaclesFromPcbKeepoutOutline } from "lib/utils/obstacles/getObstaclesFromPcbKeepoutOutline"

test("partial outline keepout retains its segment approximation", () => {
  const partialArcKeepout: PcbKeepoutOutline = {
    type: "pcb_keepout",
    pcb_keepout_id: "pcb_keepout_partial_arc",
    shape: "outline",
    outline: Array.from({ length: 13 }, (_, outlinePointIndex) => {
      const angleRadians = (outlinePointIndex * 1.5 * Math.PI) / 12
      return { x: Math.cos(angleRadians), y: Math.sin(angleRadians) }
    }),
    stroke_width: 0.1,
    layers: ["top"],
  }

  const obstacles = getObstaclesFromPcbKeepoutOutline(partialArcKeepout)

  expect(obstacles.length).toBeGreaterThan(1)
  expect(
    obstacles.some(({ obstacleId }) => obstacleId?.includes("_segment_")),
  ).toBe(true)
})
