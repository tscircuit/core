import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"

test("pad obstacles preserve opaque Circuit JSON identities", () => {
  const circuitJson = [
    {
      type: "source_component",
      source_component_id: "opaque-source-component",
      name: "U_OPAQUE",
    },
    {
      type: "source_port",
      source_port_id: "opaque-source-port-1",
      source_component_id: "opaque-source-component",
      name: "DATA_IN",
    },
    {
      type: "source_port",
      source_port_id: "opaque-source-port-2",
      source_component_id: "opaque-source-component",
      name: "DATA_OUT",
    },
    {
      type: "pcb_component",
      pcb_component_id: "opaque-pcb-component",
      source_component_id: "opaque-source-component",
    },
    {
      type: "pcb_port",
      pcb_port_id: "opaque-smt-port",
      source_port_id: "opaque-source-port-1",
      pcb_component_id: "opaque-pcb-component",
    },
    {
      type: "pcb_port",
      pcb_port_id: "opaque-plated-hole-port",
      source_port_id: "opaque-source-port-2",
      pcb_component_id: "opaque-pcb-component",
    },
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
      pcb_component_id: "opaque-pcb-component",
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
      pcb_component_id: "opaque-pcb-component",
    },
  ] as AnyCircuitElement[]

  const [smtPadObstacle, platedHoleObstacle] =
    getObstaclesFromCircuitJson(circuitJson)

  expect(smtPadObstacle.circuitJsonMetadata).toEqual({
    pcb_smtpad_id: "opaque-smt-pad",
    pcb_port_id: "opaque-smt-port",
    source_component_name: "U_OPAQUE",
    source_port_name: "DATA_IN",
  })
  expect(smtPadObstacle).toMatchObject({
    connectedTo: ["opaque-smt-pad"],
  })
  expect(platedHoleObstacle.circuitJsonMetadata).toEqual({
    pcb_plated_hole_id: "opaque-plated-hole",
    pcb_port_id: "opaque-plated-hole-port",
    source_component_name: "U_OPAQUE",
    source_port_name: "DATA_OUT",
  })
  expect(platedHoleObstacle).toMatchObject({
    connectedTo: ["opaque-plated-hole"],
  })
})
