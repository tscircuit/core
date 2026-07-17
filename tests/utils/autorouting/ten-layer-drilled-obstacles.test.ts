import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"

test("board cutouts obstruct every copper layer on a ten-layer board", () => {
  const circuitJson = [
    {
      type: "pcb_board",
      pcb_board_id: "pcb_board_0",
      center: { x: 0, y: 0 },
      num_layers: 10,
    },
    {
      type: "pcb_cutout",
      pcb_cutout_id: "pcb_cutout_0",
      shape: "rect",
      center: { x: 0, y: 0 },
      width: 1,
      height: 1,
    },
  ] as AnyCircuitElement[]

  const [cutoutObstacle] = getObstaclesFromCircuitJson(circuitJson)

  expect(cutoutObstacle.layers).toEqual([
    "top",
    "inner1",
    "inner2",
    "inner3",
    "inner4",
    "inner5",
    "inner6",
    "inner7",
    "inner8",
    "bottom",
  ])
})
