import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { fillCircleWithRects } from "lib/utils/obstacles/fillCircleWithRects"
import { fillPolygonWithRects } from "lib/utils/obstacles/fillPolygonWithRects"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"

test("a polygon cutout thinner than the sampling band still produces an obstacle", () => {
  const circuitJson = [
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
    },
  ] as unknown as AnyCircuitElement[]

  const obstacles = getObstaclesFromCircuitJson(circuitJson)

  expect(obstacles).toHaveLength(1)
  expect(obstacles[0]).toMatchObject({
    type: "rect",
    center: { x: 1, y: 0.1 },
    width: 2,
    height: 0.2,
    connectedTo: [],
  })
  expect(obstacles[0]!.layers.length).toBeGreaterThan(0)
})

test("a circular cutout smaller than the sampling band still produces an obstacle", () => {
  const circuitJson = [
    {
      type: "pcb_cutout",
      pcb_cutout_id: "small-circle",
      shape: "circle",
      center: { x: 0, y: 0 },
      radius: 0.1,
    },
  ] as unknown as AnyCircuitElement[]

  const obstacles = getObstaclesFromCircuitJson(circuitJson)

  expect(obstacles).toHaveLength(1)
  expect(obstacles[0]).toMatchObject({
    type: "rect",
    center: { x: 0, y: 0 },
    connectedTo: [],
  })
  expect(obstacles[0]!.width).toBeGreaterThan(0)
  expect(obstacles[0]!.height).toBeGreaterThan(0)
  expect(obstacles[0]!.layers.length).toBeGreaterThan(0)
})

test("fillPolygonWithRects caps the band to a short polygon's height", () => {
  const rects = fillPolygonWithRects(
    [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 2, y: 0.2 },
      { x: 0, y: 0.2 },
    ],
    { rectHeight: 0.6 },
  )

  expect(rects).toHaveLength(1)
  expect(rects[0]).toMatchObject({
    center: { x: 1, y: 0.1 },
    width: 2,
    height: 0.2,
  })
})

test("fillCircleWithRects caps the band to a small circle's diameter", () => {
  const rects = fillCircleWithRects(
    { center: { x: 0, y: 0 }, radius: 0.1 },
    { rectHeight: 0.6 },
  )

  expect(rects).toHaveLength(1)
  expect(rects[0]!.center).toEqual({ x: 0, y: 0 })
  expect(rects[0]!.width).toBeCloseTo(0.2, 10)
  expect(rects[0]!.height).toBeCloseTo(0.2, 10)
})

test("shapes taller than the band are unaffected", () => {
  const tallPolygon = fillPolygonWithRects(
    [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 2, y: 2 },
      { x: 0, y: 2 },
    ],
    { rectHeight: 0.6 },
  )
  expect(tallPolygon).toHaveLength(3)
  for (const rect of tallPolygon) {
    expect(rect.height).toBeCloseTo(0.6, 10)
  }

  const largeCircle = fillCircleWithRects(
    { center: { x: 0, y: 0 }, radius: 1 },
    { rectHeight: 0.6 },
  )
  expect(largeCircle).toHaveLength(3)
  for (const rect of largeCircle) {
    expect(rect.height).toBeCloseTo(0.6, 10)
  }
})

test("degenerate shapes produce no rects and terminate", () => {
  expect(
    fillPolygonWithRects(
      [
        { x: 0, y: 0 },
        { x: 2, y: 0 },
        { x: 1, y: 0 },
      ],
      { rectHeight: 0.6 },
    ),
  ).toEqual([])

  expect(
    fillCircleWithRects(
      { center: { x: 0, y: 0 }, radius: 0 },
      { rectHeight: 0.6 },
    ),
  ).toEqual([])
})
