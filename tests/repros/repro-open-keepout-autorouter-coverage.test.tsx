import { expect, test } from "bun:test"
import {
  getSvgFromGraphicsObject,
  mergeGraphics,
  translateGraphics,
  type GraphicsObject,
} from "graphics-debug"
import { SOLVERS } from "lib/solvers"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  applyToPoint,
  compose,
  rotateDEG,
  translate,
} from "transformation-matrix"

test("core keepouts remain blocked on every layer after autorouter preprocessing", async () => {
  for (const ccwRotationDegrees of [0, 45, 90, 180, 270]) {
    const { circuit } = getTestFixture()
    circuit.add(<board width={4} height={3} layers={4} routingDisabled />)
    circuit.render()

    // Source positions are board-world points in mm: +X right, +Y up,
    // +Z toward the top layer (right-handed). The transform below maps
    // keepout-local points into that frame, including their translation.
    const segment = {
      center: { x: 0.2, y: -0.1 },
      width: 0.6,
      height: 0.2,
      rotation: ccwRotationDegrees,
    }
    const keepoutToBoard = compose(
      translate(segment.center.x, segment.center.y),
      rotateDEG(segment.rotation),
    )
    const outline = [-segment.width / 2, segment.width / 2].map((x) =>
      applyToPoint(keepoutToBoard, { x, y: 0 }),
    )
    const boardLayers = ["top", "inner1", "inner2", "bottom"] as const
    circuit.db.pcb_keepout.insert({
      shape: "outline",
      outline,
      stroke_width: segment.height,
      layers: [...boardLayers],
      subcircuit_id: circuit.db.pcb_board.list()[0]!.subcircuit_id,
    })
    const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
      db: circuit.db,
    })
    expect(simpleRouteJson.obstacles).toHaveLength(3)
    for (const obstacle of simpleRouteJson.obstacles) {
      expect(obstacle.layers).toEqual([...boardLayers])
      expect(obstacle.connectedTo).toEqual([])
    }

    expect(simpleRouteJson.obstacles[0]).toMatchObject({
      height: segment.height,
      layers: boardLayers,
      connectedTo: [],
    })
    expect(
      (simpleRouteJson.obstacles[0]!.ccwRotationDegrees! + 360) % 360,
    ).toBeCloseTo(ccwRotationDegrees, 10)
    expect(simpleRouteJson.obstacles[0]!.width).toBeCloseTo(segment.width, 12)
    expect(simpleRouteJson.obstacles[0]!.center.x).toBeCloseTo(
      segment.center.x,
      12,
    )
    expect(simpleRouteJson.obstacles[0]!.center.y).toBeCloseTo(
      segment.center.y,
      12,
    )

    // Exercise the installed Pipeline 9 used by core, stopping at its real
    // preprocessing output before node generation or route search begins.
    const solver = new SOLVERS.AutoroutingPipelineSolver9_PreloadedTraceGraph(
      {
        bounds: simpleRouteJson.bounds,
        layerCount: simpleRouteJson.layerCount,
        minTraceWidth: simpleRouteJson.minTraceWidth,
        obstacles: simpleRouteJson.obstacles,
        connections: simpleRouteJson.connections,
      },
      { cacheProvider: null },
    )
    while (
      !solver.preprocessSimpleRouteJsonSolver?.solved &&
      !solver.failed &&
      !solver.solved
    ) {
      solver.step()
    }
    expect(solver.failed).toBe(false)
    expect(solver.preprocessSimpleRouteJsonSolver?.solved).toBe(true)
    const processed =
      solver.preprocessSimpleRouteJsonSolver!.getOutputSimpleRouteJson()
    const sourcePoints = []
    for (let xStep = 0; xStep <= 20; xStep++) {
      for (let yStep = 0; yStep <= 20; yStep++) {
        sourcePoints.push(
          applyToPoint(keepoutToBoard, {
            x: (xStep / 20 - 0.5) * segment.width,
            y: (yStep / 20 - 0.5) * segment.height,
          }),
        )
      }
    }
    const uncoveredPoints = sourcePoints.filter((point) =>
      boardLayers.some(
        (layer) =>
          !processed.obstacles.some(
            (obstacle) =>
              obstacle.layers.includes(layer) &&
              Math.abs(point.x - obstacle.center.x) <=
                obstacle.width / 2 + 1e-9 &&
              Math.abs(point.y - obstacle.center.y) <=
                obstacle.height / 2 + 1e-9,
          ),
      ),
    )
    expect(uncoveredPoints).toHaveLength(0)

    // Show the diagonal coverage; assert cardinal cases numerically too.
    if (ccwRotationDegrees === 45) {
      const sourceGraphics: GraphicsObject = {
        rects: [
          {
            center: segment.center,
            width: segment.width,
            height: segment.height,
            ccwRotationDegrees: segment.rotation,
            fill: "rgba(255, 0, 0, 0.25)",
          },
        ],
        circles: outline.map((center) => ({
          center,
          radius: segment.height / 2,
          fill: "rgba(255, 0, 0, 0.25)",
        })),
        texts: [
          {
            x: segment.center.x,
            y: 0.35,
            text: "CORE: OPEN OUTLINE KEEPOUT",
            fontSize: 0.026,
          },
        ],
      }
      const processedGraphics: GraphicsObject = {
        rects: processed.obstacles.map((obstacle) => ({
          ...obstacle,
          fill: "rgba(255, 0, 0, 0.25)",
        })),
        polygons: [
          {
            points: [
              { x: -segment.width / 2, y: -segment.height / 2 },
              { x: segment.width / 2, y: -segment.height / 2 },
              { x: segment.width / 2, y: segment.height / 2 },
              { x: -segment.width / 2, y: segment.height / 2 },
            ].map((point) => applyToPoint(keepoutToBoard, point)),
            fill: "transparent",
            stroke: "black",
            strokeWidth: 0.002,
          },
        ],
        circles: uncoveredPoints.map((point) => ({
          center: point,
          radius: 0.004,
          fill: "#e07600",
        })),
        texts: [
          {
            x: segment.center.x,
            y: 0.35,
            text: "INSTALLED AUTOROUTER OUTPUT",
            fontSize: 0.026,
          },
          {
            x: segment.center.x,
            y: 0.3,
            text: `${uncoveredPoints.length}/${sourcePoints.length} points uncovered on 4 layers`,
            fontSize: 0.022,
          },
        ],
      }
      await expect(
        getSvgFromGraphicsObject(
          [
            sourceGraphics,
            translateGraphics(
              {
                rects: simpleRouteJson.obstacles.map((obstacle) => ({
                  ...obstacle,
                  fill: "rgba(255, 0, 0, 0.25)",
                })),
                texts: [
                  {
                    x: segment.center.x,
                    y: 0.35,
                    text: `${simpleRouteJson.obstacles.length} SRJ OBSTACLES`,
                    fontSize: 0.026,
                  },
                ],
              },
              0.85,
              0,
            ),
            translateGraphics(processedGraphics, 1.7, 0),
          ].reduce((combined, panel) => mergeGraphics(combined, panel), {}),
          { backgroundColor: "white", svgWidth: 1500, svgHeight: 500 },
        ).replace(/[ \t]+$/gm, ""),
      ).toMatchSvgSnapshot(import.meta.path)
    }

    for (const obstacle of processed.obstacles) {
      expect(obstacle.ccwRotationDegrees).toBeUndefined()
      expect(obstacle.layers).toEqual([...boardLayers])
      expect(obstacle.connectedTo).toEqual([])
    }
  }
})
