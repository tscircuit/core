import { PlatedHole } from "../../../lib/components/primitive-components/PlatedHole"
import { expect, test } from "bun:test"

test("circular hole with rect pad creates rectangular obstacle", () => {
  const platedHole = new PlatedHole({
    shape: "circular_hole_with_rect_pad",
    holeDiameter: 1,
    rectPadWidth: 2,
    rectPadHeight: 3,
  })

  // Mock the position method
  platedHole._getGlobalPcbPositionBeforeLayout = () => ({ x: 10, y: 20 })

  const obstacles = platedHole.getObstacles()

  expect(obstacles).toHaveLength(1)
  expect(obstacles[0]).toEqual({
    type: "rect",
    layers: ["top", "inner1", "inner2", "bottom"],
    center: { x: 10, y: 20 },
    width: 2,
    height: 3,
    connectedTo: [],
  })
})

test("pill hole with rect pad creates rectangular obstacle", () => {
  const platedHole = new PlatedHole({
    shape: "pill_hole_with_rect_pad",
    holeWidth: 1,
    holeHeight: 2,
    rectPadWidth: 3,
    holeShape: "pill",
    padShape: "rect",
    rectPadHeight: 4,
  })

  // Mock the position method
  platedHole._getGlobalPcbPositionBeforeLayout = () => ({ x: 15, y: 25 })

  const obstacles = platedHole.getObstacles()

  expect(obstacles).toHaveLength(1)
  expect(obstacles[0]).toEqual({
    type: "rect",
    layers: ["top", "inner1", "inner2", "bottom"],
    center: { x: 15, y: 25 },
    width: 3,
    height: 4,
    connectedTo: [],
  })
})

test("circular hole creates square obstacle", () => {
  const platedHole = new PlatedHole({
    shape: "circle",
    outerDiameter: 5,
    holeDiameter: 2,
  })

  // Mock the position method
  platedHole._getGlobalPcbPositionBeforeLayout = () => ({ x: 30, y: 40 })

  const obstacles = platedHole.getObstacles()

  expect(obstacles).toHaveLength(1)
  expect(obstacles[0]).toEqual({
    type: "rect",
    layers: ["top", "inner1", "inner2", "bottom"],
    center: { x: 30, y: 40 },
    width: 5,
    height: 5,
    connectedTo: [],
  })
})

test("oval hole creates rectangular obstacle", () => {
  const platedHole = new PlatedHole({
    shape: "oval",
    outerWidth: 6,
    outerHeight: 8,
    holeWidth: 3,
    holeHeight: 4,
  })

  // Mock the position method
  platedHole._getGlobalPcbPositionBeforeLayout = () => ({ x: 50, y: 60 })

  const obstacles = platedHole.getObstacles()

  expect(obstacles).toHaveLength(1)
  expect(obstacles[0]).toEqual({
    type: "rect",
    layers: ["top", "inner1", "inner2", "bottom"],
    center: { x: 50, y: 60 },
    width: 6,
    height: 8,
    connectedTo: [],
  })
})

test("connected port is included in obstacle", () => {
  const platedHole = new PlatedHole({
    shape: "circle",
    outerDiameter: 5,
    holeDiameter: 2,
  })

  // Mock the position method
  platedHole._getGlobalPcbPositionBeforeLayout = () => ({ x: 30, y: 40 })

  // Mock the matched port
  platedHole.matchedPort = {
    pcb_port_id: "test-port-id",
  } as any

  const obstacles = platedHole.getObstacles()

  expect(obstacles).toHaveLength(1)
  expect(obstacles[0].connectedTo).toEqual(["test-port-id"])
})
