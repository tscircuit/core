import { test, expect } from "bun:test"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import type { AnyCircuitElement } from "circuit-json"

// Regression for https://github.com/tscircuit/core/issues/3734
// Small polygon and circular cutouts used to disappear from the autorouter
// input because the cutout branches requested a fixed 0.6mm sampling band.
// For shapes whose vertical extent is smaller than the band, the first
// scanline midpoint fell outside the shape and no obstacle rect was emitted.

test("thin polygon slot cutout produces at least one obstacle", () => {
  const circuitJson: AnyCircuitElement[] = [
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
  ]

  const obstacles = getObstaclesFromCircuitJson(circuitJson)
  expect(obstacles.length).toBeGreaterThan(0)

  // The single rect should approximate the 2mm x 0.2mm slot.
  const rect = obstacles[0]!
  expect(rect.type).toBe("rect")
  expect(rect.width).toBeCloseTo(2, 1)
  expect(rect.height).toBeCloseTo(0.2, 1)
  expect(rect.center.x).toBeCloseTo(1, 1)
  expect(rect.center.y).toBeCloseTo(0.1, 1)
  // Cutouts block every copper layer (default 4-layer board) and carry no
  // connectivity.
  expect(rect.layers).toContain("top")
  expect(rect.layers).toContain("bottom")
  expect(rect.connectedTo).toEqual([])
})

test("small circular cutout produces at least one obstacle", () => {
  const circuitJson: AnyCircuitElement[] = [
    {
      type: "pcb_cutout",
      pcb_cutout_id: "small-circle",
      shape: "circle",
      center: { x: 0, y: 0 },
      radius: 0.1,
    } as any,
  ]

  const obstacles = getObstaclesFromCircuitJson(circuitJson)
  expect(obstacles.length).toBeGreaterThan(0)

  const rect = obstacles[0]!
  expect(rect.type).toBe("rect")
  // Width should approximate the diameter (0.2mm).
  expect(rect.width).toBeCloseTo(0.2, 1)
  expect(rect.center.x).toBeCloseTo(0, 1)
  expect(rect.layers).toContain("top")
  expect(rect.layers).toContain("bottom")
  expect(rect.connectedTo).toEqual([])
})

test("thin cutouts reach the SimpleRouteJson obstacle list", () => {
  const circuitJson: AnyCircuitElement[] = [
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
    {
      type: "pcb_cutout",
      pcb_cutout_id: "small-circle",
      shape: "circle",
      center: { x: 5, y: 0 },
      radius: 0.1,
    } as any,
  ]

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson,
  })
  expect(simpleRouteJson.obstacles.length).toBeGreaterThanOrEqual(2)
})