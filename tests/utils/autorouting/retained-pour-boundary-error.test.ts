import { expect, test } from "bun:test"
import Flatten from "@flatten-js/core"
import { getPourPolygon } from "@tscircuit/circuit-json-util"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getObstaclesFromCopperPour } from "lib/utils/obstacles/get-obstacles-from-copper-pour"
import { getRetainedPourHoleControls } from "tests/repros/fixtures/retained-pour.fixture"

test("retained pour overfill is bounded by the actual minimum copper width", async () => {
  // Circuit-world points in mm (+X right, +Y up, +Z above); no transform here.
  // Narrow authored traces override the board default in the resolved SRJ.
  const { circuit, circuitJson } = await getRetainedPourHoleControls(0.05, 0.15)
  const original = structuredClone(circuitJson)
  const input = getSimpleRouteJsonFromCircuitJson({
    circuitJson,
  }).simpleRouteJson
  expect(input.minTraceWidth).toBe(0.05)
  const maxBoundaryError = input.minTraceWidth / 4
  let largestBoundaryError = 0
  let checkedRectangles = 0
  for (const pour of circuit.db.pcb_copper_pour.list()) {
    const polygon = getPourPolygon(pour)
    const cover = input.obstacles.filter((obstacle) =>
      obstacle.connectedTo.includes(pour.pcb_copper_pour_id),
    )
    expect(cover.length).toBeGreaterThan(0)
    expect(cover.every((obstacle) => !obstacle.isCopperPour)).toBe(true)
    checkedRectangles += cover.length
    for (const obstacle of cover) {
      // Every rectangle corner lies on or within epsilon of actual copper;
      // sample each horizontal edge too, including the circle/rotated void.
      for (const fraction of [0, 0.25, 0.5, 0.75, 1]) {
        for (const ySide of [-1, 1]) {
          const point = Flatten.point(
            obstacle.center.x + (fraction - 0.5) * obstacle.width,
            obstacle.center.y + (ySide * obstacle.height) / 2,
          )
          if (polygon.contains(point)) continue
          largestBoundaryError = Math.max(
            largestBoundaryError,
            point.distanceTo(polygon)[0],
          )
        }
      }
    }
  }
  expect(checkedRectangles).toBeLessThan(2_000)
  expect(largestBoundaryError).toBeGreaterThan(0.001)
  expect(largestBoundaryError).toBeLessThanOrEqual(maxBoundaryError + 1e-10)
  expect(circuitJson).toEqual(original)

  // A larger axis-aligned region does not acquire a board-sized raster.
  const largeRectangle = getObstaclesFromCopperPour(
    {
      type: "pcb_copper_pour",
      pcb_copper_pour_id: "large_axis_aligned_pour",
      shape: "rect",
      layer: "top",
      center: { x: 0, y: 0 },
      width: 100,
      height: 80,
      covered_with_solder_mask: true,
    },
    [],
    maxBoundaryError,
  )
  expect(largeRectangle).toHaveLength(1)
  expect(largeRectangle[0]!.width).toBeCloseTo(100, 10)
  expect(largeRectangle[0]!.height).toBeCloseTo(80, 10)
})
