import { expect, test } from "bun:test"
import Flatten from "@flatten-js/core"
import {
  AutoroutingPipelineSolver9_PreloadedTraceGraph,
  convertSrjToGraphicsObject,
} from "@tscircuit/capacity-autorouter"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"

test("routing through a narrow channel between sloping polygon cutouts", () => {
  // Board-world mm (+X right, +Y up). The parallel edges y=x and y=x+1
  // leave a 1/sqrt(2) mm channel spanning the board, with no path around it.
  const cutoutPoints = [
    [
      { x: -4, y: -4 },
      { x: 4, y: -4 },
      { x: 4, y: 4 },
    ],
    [
      { x: -4, y: -3 },
      { x: -4, y: 4 },
      { x: 3, y: 4 },
    ],
  ]
  const cutouts = cutoutPoints.map((points, index) => ({
    type: "pcb_cutout" as const,
    pcb_cutout_id: `sloping_cutout_${index}`,
    shape: "polygon" as const,
    points,
  }))
  const obstacles = getObstaclesFromCircuitJson([
    {
      type: "pcb_board",
      pcb_board_id: "pcb_board_0",
      center: { x: 0, y: 0 },
      width: 8,
      height: 8,
      num_layers: 2,
      thickness: 1.6,
      material: "fr4",
    },
    ...cutouts,
  ])
  const input = {
    layerCount: 2,
    minTraceWidth: 0.1,
    minTraceToPadEdgeClearance: 0.15,
    bounds: { minX: -4, maxX: 4, minY: -4, maxY: 4 },
    obstacles,
    connections: [
      {
        name: "signal",
        pointsToConnect: [
          { x: -2, y: -1.5, layer: "top" },
          { x: 2, y: 2.5, layer: "top" },
        ],
      },
    ],
  }
  const solver = new AutoroutingPipelineSolver9_PreloadedTraceGraph(input)
  solver.solve()
  expect(solver.solved).toBe(true)
  expect(solver.failed).toBe(false)
  const output = solver.getOutputSimpleRouteJson()
  expect(output.traces).toHaveLength(1)
  const trace = output.traces![0]!
  // Keep the route inside the board so it cannot bypass the channel ends.
  for (const point of trace.route) {
    expect(point.x).toBeGreaterThanOrEqual(input.bounds.minX)
    expect(point.x).toBeLessThanOrEqual(input.bounds.maxX)
    expect(point.y).toBeGreaterThanOrEqual(input.bounds.minY)
    expect(point.y).toBeLessThanOrEqual(input.bounds.maxY)
  }
  const endpoints = [trace.route[0]!, trace.route.at(-1)!]
  for (const terminal of input.connections[0]!.pointsToConnect) {
    expect(
      endpoints.some(
        (point) =>
          Math.hypot(point.x - terminal.x, point.y - terminal.y) < 1e-9,
      ),
    ).toBe(true)
  }
  const sourcePolygons = cutoutPoints.map(
    (points) =>
      new Flatten.Polygon(points.map(({ x, y }) => new Flatten.Point(x, y))),
  )
  let minimumCopperClearance = Infinity
  for (let routeIndex = 1; routeIndex < trace.route.length; routeIndex++) {
    const start = trace.route[routeIndex - 1]!,
      end = trace.route[routeIndex]!
    expect(start.route_type).toBe("wire")
    expect(end.route_type).toBe("wire")
    if (start.route_type !== "wire" || end.route_type !== "wire") continue
    expect(start.layer).toBe("top")
    expect(end.layer).toBe("top")
    if (Math.hypot(end.x - start.x, end.y - start.y) < 1e-9) continue
    const segment = new Flatten.Segment(
      new Flatten.Point(start.x, start.y),
      new Flatten.Point(end.x, end.y),
    )
    for (const polygon of sourcePolygons) {
      expect(polygon.intersect(segment)).toHaveLength(0)
      minimumCopperClearance = Math.min(
        minimumCopperClearance,
        polygon.distanceTo(segment)[0] - Math.max(start.width, end.width) / 2,
      )
    }
  }
  expect(minimumCopperClearance).toBeGreaterThanOrEqual(0.15)
  const graphics = convertSrjToGraphicsObject(output)
  graphics.lines = [
    ...(graphics.lines ?? []),
    ...cutoutPoints.map((points) => ({
      points: [...points, points[0]!],
      strokeColor: "#f59e0b",
      strokeWidth: 0.02,
    })),
  ]
  const svg = getSvgFromGraphicsObject(graphics, {
    svgWidth: 800,
    svgHeight: 600,
  }).replace(
    "</svg>",
    `<text x="20" y="26" font-family="Arial" font-size="16">0.707 mm channel / 0.1 mm trace / copper clearance ${minimumCopperClearance.toFixed(3)} mm</text></svg>`,
  )
  expect(svg).toMatchSvgSnapshot(import.meta.path)
})
