import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schPinArrangement preserves pcb_port links and connectivity map keys for multi-pad pins (#4354)", async () => {
  const c10984Footprint: AnyCircuitElement[] = [
    {
      type: "source_component",
      source_component_id: "source_component_0",
      ftype: "simple_chip",
      name: "J1",
    },
    {
      type: "source_port",
      source_port_id: "source_port_0",
      name: "pin1",
      pin_number: 1,
      port_hints: ["1", "pin1"],
      source_component_id: "source_component_0",
    },
    {
      type: "source_port",
      source_port_id: "source_port_1",
      name: "pin2",
      pin_number: 2,
      port_hints: ["2", "pin2"],
      source_component_id: "source_component_0",
    },
    {
      type: "schematic_symbol",
      schematic_symbol_id: "schematic_symbol_0",
      name: "c10984_symbol",
    },
    {
      type: "schematic_component",
      schematic_component_id: "schematic_component_0",
      source_component_id: "source_component_0",
      schematic_symbol_id: "schematic_symbol_0",
      center: { x: 0, y: 0 },
      size: { width: 2, height: 2 },
      is_box_with_pins: true,
    },
    {
      type: "schematic_port",
      schematic_port_id: "schematic_port_0",
      schematic_component_id: "schematic_component_0",
      source_port_id: "source_port_0",
      center: { x: -1, y: 0.5 },
      facing_direction: "left",
      side_of_component: "left",
      distance_from_component_edge: 0.4,
      pin_number: 1,
      display_pin_label: "1",
      is_connected: false,
    },
    {
      type: "schematic_port",
      schematic_port_id: "schematic_port_1",
      schematic_component_id: "schematic_component_0",
      source_port_id: "source_port_1",
      center: { x: -1, y: -0.5 },
      facing_direction: "left",
      side_of_component: "left",
      distance_from_component_edge: 0.4,
      pin_number: 2,
      display_pin_label: "2",
      is_connected: false,
    },
    {
      type: "pcb_component",
      pcb_component_id: "pcb_component_0",
      source_component_id: "source_component_0",
      center: { x: 0, y: 0 },
      width: 6,
      height: 6,
      layer: "top",
      rotation: 0,
      obstructs_within_bounds: true,
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pcb_smtpad_0",
      pcb_component_id: "pcb_component_0",
      shape: "rect",
      x: -2,
      y: 0,
      width: 1,
      height: 1,
      layer: "top",
      port_hints: ["1"],
    },
    {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "pcb_plated_hole_0",
      pcb_component_id: "pcb_component_0",
      shape: "circle",
      x: 2,
      y: 2,
      outer_diameter: 2,
      hole_diameter: 1,
      layers: ["top", "bottom"],
      port_hints: ["2"],
    },
    {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "pcb_plated_hole_1",
      pcb_component_id: "pcb_component_0",
      shape: "circle",
      x: 2,
      y: -2,
      outer_diameter: 2,
      hole_diameter: 1,
      layers: ["top", "bottom"],
      port_hints: ["2"],
    },
  ]

  const { circuit } = getTestFixture({
    platform: {
      footprintLibraryMap: {
        lcsc: async () => ({
          footprintCircuitJson: c10984Footprint,
        }),
      },
    },
  })

  circuit.add(
    <board width="30mm" height="20mm">
      <chip
        name="J1"
        footprint="lcsc:C10984"
        schPinArrangement={{
          rightSide: {
            direction: "top-to-bottom",
            pins: ["pin1", "pin2"],
          },
        }}
      />
      <trace from=".J1 > .pin1" to="net.VBUS" />
      <trace from=".J1 > .pin2" to="net.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const platedHoles = circuit.db.pcb_plated_hole.list()
  expect(platedHoles).toHaveLength(2)

  for (const ph of platedHoles) {
    expect(ph.pcb_port_id).toBeDefined()
  }

  const pcbPorts = circuit.db.pcb_port.list()
  expect(pcbPorts).toHaveLength(3)

  const sourcePortsForPin2 = circuit.db.source_port
    .list()
    .filter((sp) => sp.name === "pin2" || sp.name.startsWith("pin2_"))
  expect(sourcePortsForPin2).toHaveLength(2)

  const gndKey = sourcePortsForPin2.find(
    (sp) => sp.name === "pin2",
  )?.subcircuit_connectivity_map_key
  expect(gndKey).toBeDefined()

  for (const sp of sourcePortsForPin2) {
    expect(sp.subcircuit_connectivity_map_key).toBe(gndKey)
  }
})
