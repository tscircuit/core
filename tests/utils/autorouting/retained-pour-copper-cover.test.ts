import { expect, test } from "bun:test"
import type { PcbCopperPour } from "circuit-json"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"

// Board-world points in mm, right-handed (+X right, +Y up, +Z above).
test("retained pour cover includes curves and tiny islands while keeping holes open", () => {
  const base = {
    type: "pcb_copper_pour" as const,
    pcb_copper_pour_id: "pcb_copper_pour_test",
    covered_with_solder_mask: true,
    layer: "bottom" as const,
  }
  const covers = (pour: PcbCopperPour, x: number, y: number) =>
    getObstaclesFromCircuitJson([pour]).some(
      (obstacle) =>
        Math.abs(x - obstacle.center.x) <= obstacle.width / 2 &&
        Math.abs(y - obstacle.center.y) <= obstacle.height / 2,
    )
  for (const winding of [-1, 1]) {
    const annulus: PcbCopperPour = {
      ...base,
      shape: "brep",
      brep_shape: {
        outer_ring: {
          vertices: [
            { x: -2, y: 0, bulge: winding },
            { x: 2, y: 0, bulge: winding },
          ],
        },
        inner_rings: [
          {
            vertices: [
              { x: -1, y: 0, bulge: -winding },
              { x: 1, y: 0, bulge: -winding },
            ],
          },
        ],
      },
    }
    const obstacles = getObstaclesFromCircuitJson([annulus])
    const isCovered = (x: number, y: number) =>
      obstacles.some(
        (obstacle) =>
          Math.abs(x - obstacle.center.x) <= obstacle.width / 2 &&
          Math.abs(y - obstacle.center.y) <= obstacle.height / 2,
      )
    // Independent analytical circles, including their curved extrema.
    for (let degrees = 0; degrees < 360; degrees++) {
      const angle = (degrees * Math.PI) / 180
      for (const radius of [1.001, 1.5, 1.999, 2]) {
        expect(
          isCovered(radius * Math.cos(angle), radius * Math.sin(angle)),
        ).toBe(true)
      }
      expect(isCovered(0.8 * Math.cos(angle), 0.8 * Math.sin(angle))).toBe(
        false,
      )
    }
    expect(obstacles.every((obstacle) => obstacle.layers[0] === "bottom")).toBe(
      true,
    )
  }
  const tiny: PcbCopperPour = {
    ...base,
    shape: "polygon",
    points: [
      { x: 0, y: 0 },
      { x: 1e-7, y: 0 },
      { x: 0, y: 1e-7 },
    ],
  }
  expect(covers(tiny, 1e-8, 1e-8)).toBe(true)
  const concave: PcbCopperPour = {
    ...base,
    shape: "polygon",
    points: [
      { x: 0, y: 0 },
      { x: 3, y: 0 },
      { x: 3, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 3 },
      { x: 0, y: 3 },
    ],
  }
  expect(covers(concave, 2, 0.5)).toBe(true)
  expect(covers(concave, 0.5, 2)).toBe(true)
  expect(covers(concave, 2, 2)).toBe(false)
  const rotated: PcbCopperPour = {
    ...base,
    shape: "rect",
    center: { x: 10, y: -10 },
    width: 4,
    height: 2,
    rotation: 90,
  }
  expect(covers(rotated, 10.9, -8.1)).toBe(true)
  expect(covers(rotated, 11.1, -10)).toBe(false)
  expect(covers(rotated, 10, -7.9)).toBe(false)
})
