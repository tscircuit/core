import { expect, test } from "bun:test"
import Flatten from "@flatten-js/core"
import {
  AutoroutingPipelineSolver9_PreloadedTraceGraph,
  convertSrjToGraphicsObject,
} from "@tscircuit/capacity-autorouter"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"

// Expected failure in the repro; the stacked fix enables this regression.
const regressionTest = test

regressionTest(
  "routing detours around a polygon slot thinner than the sampling band",
  () => {
    const points = [
      { x: -1, y: -0.1 },
      { x: 1, y: -0.1 },
      { x: 1, y: 0.1 },
      { x: -1, y: 0.1 },
    ]
    const obstacles = getObstaclesFromCircuitJson([
      {
        type: "pcb_board",
        pcb_board_id: "pcb_board_0",
        center: { x: 0, y: 0 },
        width: 6,
        height: 4,
        num_layers: 2,
        thickness: 1.6,
        material: "fr4",
      },
      {
        type: "pcb_cutout",
        pcb_cutout_id: "pcb_cutout_slot",
        shape: "polygon",
        points,
      },
    ])
    const solver = new AutoroutingPipelineSolver9_PreloadedTraceGraph({
      layerCount: 2,
      minTraceWidth: 0.1,
      bounds: { minX: -3, maxX: 3, minY: -2, maxY: 2 },
      obstacles,
      connections: [
        {
          name: "signal",
          pointsToConnect: [
            { x: 0, y: -1, layer: "top" },
            { x: 0, y: 1, layer: "top" },
          ],
        },
      ],
    })
    solver.solve()
    expect(solver.solved).toBe(true)
    expect(solver.failed).toBe(false)
    const output = solver.getOutputSimpleRouteJson()
    expect(output.traces?.length).toBeGreaterThan(0)
    const cutout = new Flatten.Polygon(
      points.map(({ x, y }) => new Flatten.Point(x, y)),
    )
    for (const trace of output.traces!) {
      for (let index = 1; index < trace.route.length; index++) {
        const start = trace.route[index - 1]!,
          end = trace.route[index]!
        if (start.route_type !== "wire" || end.route_type !== "wire") continue
        if (Math.hypot(end.x - start.x, end.y - start.y) < 1e-9) continue
        const segment = new Flatten.Segment(
          new Flatten.Point(start.x, start.y),
          new Flatten.Point(end.x, end.y),
        )
        expect(cutout.intersect(segment)).toHaveLength(0)
        expect(cutout.distanceTo(segment)[0]).toBeGreaterThanOrEqual(
          Math.max(start.width, end.width) / 2 - 1e-6,
        )
      }
    }
    const svg = getSvgFromGraphicsObject(convertSrjToGraphicsObject(output), {
      svgWidth: 800,
      svgHeight: 500,
    }).replace(
      "</svg>",
      '<text x="20" y="26" font-family="Arial" font-size="18">Signal detours around a 2 × 0.2 mm polygon cutout</text></svg>',
    )
    expect(svg).toMatchSvgSnapshot(import.meta.path)
  },
)
