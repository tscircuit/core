import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"

test("pad obstacles preserve opaque Circuit JSON identities", () => {
  const circuitJson = [
    {
      type: "pcb_smtpad",
      shape: "rect",
      pcb_smtpad_id: "opaque-smt-pad",
      pcb_port_id: "opaque-smt-port",
      x: 1,
      y: 2,
      width: 0.8,
      height: 0.4,
      layer: "top",
    },
    {
      type: "pcb_plated_hole",
      shape: "circle",
      pcb_plated_hole_id: "opaque-plated-hole",
      pcb_port_id: "opaque-plated-hole-port",
      x: 3,
      y: 4,
      outer_diameter: 1,
      hole_diameter: 0.5,
      layers: ["top", "bottom"],
    },
  ] as AnyCircuitElement[]

  const [smtPadObstacle, platedHoleObstacle] =
    getObstaclesFromCircuitJson(circuitJson)

  expect(smtPadObstacle.metadata).toEqual({
    pcb_smtpad_id: "opaque-smt-pad",
    pcb_port_id: "opaque-smt-port",
  })
  expect(smtPadObstacle).toMatchObject({
    connectedTo: ["opaque-smt-pad"],
  })
  expect(platedHoleObstacle.metadata).toEqual({
    pcb_plated_hole_id: "opaque-plated-hole",
    pcb_port_id: "opaque-plated-hole-port",
  })
  expect(platedHoleObstacle).toMatchObject({
    connectedTo: ["opaque-plated-hole"],
  })
})
