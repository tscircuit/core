import { expect, test } from "bun:test"
import type { PcbKeepoutOutline } from "circuit-json"
import { getObstaclesFromPcbKeepoutOutline } from "lib/utils/obstacles/getObstaclesFromPcbKeepoutOutline"

test("near-complete open keepout arcs retain their segment approximation", () => {
  for (const sweepDegrees of [345, 350, 355]) {
    const openArcKeepout: PcbKeepoutOutline = {
      type: "pcb_keepout",
      pcb_keepout_id: `pcb_keepout_${sweepDegrees}_degree_arc`,
      shape: "outline",
      outline: Array.from({ length: 48 }, (_, outlinePointIndex) => {
        const angleRadians =
          (outlinePointIndex * sweepDegrees * Math.PI) / (47 * 180)
        return {
          x: 10 * Math.cos(angleRadians),
          y: 10 * Math.sin(angleRadians),
        }
      }),
      stroke_width: 0.2,
      layers: ["top"],
    }

    const obstacles = getObstaclesFromPcbKeepoutOutline(openArcKeepout)

    expect(obstacles.length).toBeGreaterThan(1)
    expect(
      obstacles.some(({ obstacleId }) => obstacleId?.includes("_segment_")),
    ).toBe(true)
  }
})
