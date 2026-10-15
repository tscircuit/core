import { expect, test } from "bun:test"
import { AutoroutingPipelineSolver9_PreloadedTraceGraph } from "@tscircuit/capacity-autorouter"
import type { PcbCutoutPolygon } from "circuit-json"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import {
  containsPoint,
  getUncoveredPolygonArea,
  renderPolygonCutoutCoverage,
} from "tests/fixtures/polygon-cutout-coverage"
import sourceCutout from "./fixtures/pmp22650-polygon-cutout.json"

// Exact TI-derived source record from dataset-srj24@6340ee4, sample024.
// https://github.com/tscircuit/dataset-srj24/blob/6340ee4/circuit-json/sample024-pmp22650-main.json
// Source geometry remains subject to https://www.ti.com/legal/terms-conditions/terms-of-use.html
test("PMP22650 cutout is fully blocked before and after autorouter preprocessing", () => {
  const cutout = sourceCutout as PcbCutoutPolygon
  const witness = { x: 200.08379856, y: 78.98260016 }
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: [
      {
        type: "pcb_board",
        pcb_board_id: "pcb_board_0",
        center: { x: 220, y: 95 },
        width: 90,
        height: 90,
        num_layers: 8,
        thickness: 1.6,
        material: "fr4",
      },
      cutout,
    ],
    ignoreExistingTopLevelPcbRouteState: true,
  })
  const layers = [
    "top",
    "inner1",
    "inner2",
    "inner3",
    "inner4",
    "inner5",
    "inner6",
    "bottom",
  ]
  expect(
    getUncoveredPolygonArea(cutout.points, simpleRouteJson.obstacles),
  ).toBeLessThan(1e-6)
  for (const obstacle of simpleRouteJson.obstacles) {
    expect(obstacle.layers).toEqual(layers)
    expect(obstacle.connectedTo).toEqual([])
    expect(obstacle.obstacleId).toStartWith(`${cutout.pcb_cutout_id}_rect_`)
  }
  const pipeline = new AutoroutingPipelineSolver9_PreloadedTraceGraph({
    ...simpleRouteJson,
    traces: [],
  })
  for (
    let step = 0;
    step < 100 &&
    !pipeline.preprocessSimpleRouteJsonSolver?.solved &&
    !pipeline.failed;
    step++
  )
    pipeline.step()
  expect(pipeline.failed).toBe(false)
  expect(pipeline.preprocessSimpleRouteJsonSolver?.solved).toBe(true)
  const preprocessed =
    pipeline.preprocessSimpleRouteJsonSolver!.getOutputSimpleRouteJson()
  for (const layer of layers) {
    const obstacles = preprocessed.obstacles.filter((obstacle) =>
      obstacle.layers.includes(layer),
    )
    expect(obstacles.some((obstacle) => containsPoint(obstacle, witness))).toBe(
      true,
    )
    expect(getUncoveredPolygonArea(cutout.points, obstacles)).toBeLessThan(1e-6)
  }
  expect(
    renderPolygonCutoutCoverage({
      points: cutout.points,
      rects: simpleRouteJson.obstacles,
      title: "PMP22650 — polygon cutout coverage",
      witness,
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
