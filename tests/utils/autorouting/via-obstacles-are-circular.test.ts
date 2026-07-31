import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"

test("vias produce explicitly circular obstacles", () => {
  const circuitJson = [
    {
      type: "pcb_via",
      pcb_via_id: "via_without_a_type_prefix",
      x: 1,
      y: 2,
      outer_diameter: 0.6,
      hole_diameter: 0.3,
      layers: ["top", "bottom"],
    },
  ] as AnyCircuitElement[]

  const [viaObstacle] = getObstaclesFromCircuitJson(circuitJson)

  expect(viaObstacle).toMatchObject({
    type: "rect",
    shape: "circle",
    center: { x: 1, y: 2 },
    width: 0.6,
    height: 0.6,
    connectedTo: ["via_without_a_type_prefix"],
  })
})
