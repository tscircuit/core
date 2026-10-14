import { expect, test } from "bun:test"
import type { PcbKeepoutOutline } from "circuit-json"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { getObstaclesFromPcbKeepoutOutline } from "lib/utils/obstacles/getObstaclesFromPcbKeepoutOutline"

const PMP22650_ARC_POINT_COUNT = 48
const PMP22650_ARC_START_DEGREES = 14.036243467900022
const PMP22650_ARC_END_DEGREES = 365.7105931375

// Exact geometry from PMP22650's layer-specific Altium keepout arc 4641.
const pmp22650KeepoutArc: PcbKeepoutOutline = {
  type: "pcb_keepout",
  pcb_keepout_id: "pcb_keepout_altium_arc_4641",
  shape: "outline",
  outline: Array.from(
    { length: PMP22650_ARC_POINT_COUNT },
    (_, outlinePointIndex) => {
      const progress = outlinePointIndex / (PMP22650_ARC_POINT_COUNT - 1)
      const angleDegrees =
        PMP22650_ARC_START_DEGREES +
        progress * (PMP22650_ARC_END_DEGREES - PMP22650_ARC_START_DEGREES)
      const angleRadians = (angleDegrees * Math.PI) / 180

      return {
        x: 135.89 + 0.254 * Math.cos(angleRadians),
        y: 98.9584 + 0.254 * Math.sin(angleRadians),
      }
    },
  ),
  stroke_width: 0.0254,
  layers: ["inner4"],
  description: "Altium arc keepout",
}

test("PMP22650 near-circular keepout arc expands into many SRJ obstacles", () => {
  const obstacles = getObstaclesFromPcbKeepoutOutline(pmp22650KeepoutArc)

  expect(obstacles).toHaveLength(286)
  expect(
    getSvgFromGraphicsObject({
      rects: obstacles,
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
