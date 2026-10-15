import { expect, test } from "bun:test"
import { pcb_keepout_outline } from "circuit-json"
import {
  getSvgFromGraphicsObject,
  mergeGraphics,
  translateGraphics,
  type GraphicsObject,
} from "graphics-debug"
import { SOLVERS } from "lib/solvers"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import keepoutData from "tests/fixtures/assets/sample024-open-keepouts.json"
import {
  applyToPoint,
  compose,
  inverse,
  rotateDEG,
  translate,
} from "transformation-matrix"

test("Sample024 open keepouts use 475 obstacles without losing coverage or closing their gaps", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<board width={300} height={250} layers={8} routingDisabled />)
  circuit.render()

  // Exact five open arcs from dataset-srj24@6340ee4's
  // circuit-json/sample024-pmp22650-main.json. Source/output positions are
  // board-world points in mm: +X right, +Y up, +Z toward the top PCB layer
  // (right-handed). Only the graphics panels translate them for display.
  const keepouts = pcb_keepout_outline.array().parse(keepoutData)
  for (const keepout of keepouts) {
    circuit.db.pcb_keepout.insert({
      ...keepout,
      subcircuit_id: circuit.db.pcb_board.list()[0]!.subcircuit_id,
    })
  }
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
  })
  expect(simpleRouteJson.obstacles).toHaveLength(475)

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
  const panels: GraphicsObject[] = []

  for (const [arcIndex, keepout] of keepouts.entries()) {
    const native = simpleRouteJson.obstacles.filter((obstacle) =>
      obstacle.obstacleId?.startsWith(`${keepout.pcb_keepout_id}_`),
    )
    const normalized = processed.obstacles.filter((obstacle) =>
      obstacle.obstacleId?.startsWith(`${keepout.pcb_keepout_id}_`),
    )
    expect(native).toHaveLength(95)
    expect(normalized).toHaveLength(95)
    const strokePoints = []
    for (
      let segmentIndex = 0;
      segmentIndex < keepout.outline.length - 1;
      segmentIndex++
    ) {
      const start = keepout.outline[segmentIndex]!
      const end = keepout.outline[segmentIndex + 1]!
      const dx = end.x - start.x
      const dy = end.y - start.y
      const segmentToBoard = compose(
        translate(start.x, start.y),
        rotateDEG((Math.atan2(dy, dx) * 180) / Math.PI),
      )
      for (let along = 0; along <= 10; along++) {
        for (const across of [-0.5, 0, 0.5]) {
          strokePoints.push(
            applyToPoint(segmentToBoard, {
              x: (Math.hypot(dx, dy) * along) / 10,
              y: keepout.stroke_width * across,
            }),
          )
        }
      }
    }
    for (const center of keepout.outline) {
      for (let angle = 0; angle < 360; angle += 15) {
        strokePoints.push(
          applyToPoint(
            compose(translate(center.x, center.y), rotateDEG(angle)),
            {
              x: keepout.stroke_width / 2,
              y: 0,
            },
          ),
        )
      }
    }
    const first = keepout.outline[0]!
    const last = keepout.outline.at(-1)!
    const gapMidpoint = { x: (first.x + last.x) / 2, y: (first.y + last.y) / 2 }
    const panelCenter = {
      x:
        (Math.min(...keepout.outline.map((point) => point.x)) +
          Math.max(...keepout.outline.map((point) => point.x))) /
        2,
      y:
        (Math.min(...keepout.outline.map((point) => point.y)) +
          Math.max(...keepout.outline.map((point) => point.y))) /
        2,
    }

    for (const [stage, obstacles] of [native, normalized].entries()) {
      const localObstacles = obstacles.map((obstacle) => ({
        obstacle,
        toLocal: inverse(
          compose(
            translate(obstacle.center.x, obstacle.center.y),
            rotateDEG(obstacle.ccwRotationDegrees ?? 0),
          ),
        ),
      }))
      const isBlocked = (point: { x: number; y: number }) =>
        localObstacles.some(({ obstacle, toLocal }) => {
          const local = applyToPoint(toLocal, point)
          return (
            Math.abs(local.x) <= obstacle.width / 2 + 1e-9 &&
            Math.abs(local.y) <= obstacle.height / 2 + 1e-9
          )
        })
      const uncoveredPoints = strokePoints.filter((point) => !isBlocked(point))
      expect(uncoveredPoints).toHaveLength(0)
      expect(isBlocked(gapMidpoint)).toBe(false)
      for (const obstacle of obstacles) {
        expect(obstacle.layers).toEqual(["inner4"])
        expect(obstacle.connectedTo).toEqual([])
      }
      panels.push(
        translateGraphics(
          {
            rects: obstacles.map((obstacle) => ({
              ...obstacle,
              fill: "rgba(255, 0, 0, 0.25)",
            })),
            lines: [
              {
                points: keepout.outline,
                strokeColor: "black",
                strokeWidth: 0.002,
              },
            ],
            circles: [
              { center: gapMidpoint, radius: 0.004, fill: "green" },
              ...uncoveredPoints.map((center) => ({
                center,
                radius: 0.0015,
                fill: "#e07600",
              })),
            ],
            texts: [
              {
                x: panelCenter.x,
                y: panelCenter.y + 0.34,
                text: `ARC ${arcIndex + 1}: ${stage === 0 ? "CORE" : "AUTOROUTER"} / ${obstacles.length}`,
                fontSize: 0.025,
              },
              {
                x: panelCenter.x,
                y: panelCenter.y + 0.3,
                text: `${uncoveredPoints.length}/${strokePoints.length} stroke points uncovered`,
                fontSize: 0.02,
              },
            ],
          },
          arcIndex * 0.72 - panelCenter.x,
          -stage * 0.85 - panelCenter.y,
        ),
      )
    }
  }
  await expect(
    getSvgFromGraphicsObject(
      panels.reduce((combined, panel) => mergeGraphics(combined, panel), {}),
      {
        svgWidth: 1600,
        svgHeight: 800,
        backgroundColor: "white",
      },
    ).replace(/[ \t]+$/gm, ""),
  ).toMatchSvgSnapshot(import.meta.path)
})
