import { expect, test } from "bun:test"
import type { AnyCircuitElement, LayerRef } from "circuit-json"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"

const getBoardLayers = (layerCount: number): LayerRef[] => [
  "top",
  ...Array.from(
    { length: layerCount - 2 },
    (_, index) => `inner${index + 1}` as LayerRef,
  ),
  "bottom",
]

test("Circuit JSON to SRJ preserves through-hole layer coverage", () => {
  for (const layerCount of [2, 4, 6, 8]) {
    const boardLayers = getBoardLayers(layerCount)
    const circuitJson: AnyCircuitElement[] = [
      {
        type: "pcb_board",
        pcb_board_id: `pcb_board_${layerCount}`,
        center: { x: 0, y: 0 },
        width: 10,
        height: 10,
        num_layers: layerCount,
      } as AnyCircuitElement,
      {
        type: "pcb_plated_hole",
        pcb_plated_hole_id: `pcb_plated_hole_${layerCount}`,
        shape: "circle",
        x: -1,
        y: 0,
        outer_diameter: 1,
        hole_diameter: 0.5,
        layers: boardLayers,
      } as AnyCircuitElement,
      {
        type: "pcb_hole",
        pcb_hole_id: `pcb_hole_${layerCount}`,
        hole_shape: "circle",
        x: 1,
        y: 0,
        hole_diameter: 0.5,
      } as AnyCircuitElement,
    ]

    const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
      circuitJson,
    })
    const platedHoleObstacle = simpleRouteJson.obstacles.find(
      (obstacle) =>
        obstacle.circuitJsonMetadata?.pcb_plated_hole_id ===
        `pcb_plated_hole_${layerCount}`,
    )
    const nonPlatedHoleObstacle = simpleRouteJson.obstacles.find(
      (obstacle) => obstacle.center.x === 1 && obstacle.center.y === 0,
    )

    expect(platedHoleObstacle?.layers).toEqual(boardLayers)
    expect(nonPlatedHoleObstacle?.layers).toEqual(boardLayers)
  }

  const partialSpanLayers: LayerRef[] = ["inner2", "inner3"]
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: [
      {
        type: "pcb_board",
        pcb_board_id: "pcb_board_partial_span",
        center: { x: 0, y: 0 },
        width: 10,
        height: 10,
        num_layers: 8,
      } as AnyCircuitElement,
      {
        type: "pcb_plated_hole",
        pcb_plated_hole_id: "pcb_plated_hole_partial_span",
        shape: "circle",
        x: 0,
        y: 0,
        outer_diameter: 1,
        hole_diameter: 0.5,
        layers: partialSpanLayers,
      } as AnyCircuitElement,
    ],
  })

  expect(simpleRouteJson.obstacles[0]?.layers).toEqual(partialSpanLayers)
})
