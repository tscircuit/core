import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("group id present in pcb_component, schematic_component and source_component", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <group name="G1">
        <resistor name="R1" footprint={"0402"} resistance={100} />
        <resistor name="R2" footprint={"0402"} resistance={100} />
      </group>
      <capacitor name="C1" footprint={"0402"} capacitance={100} />
    </board>,
  )

  circuit.renderUntilSettled()

  const schComponents = circuit.db.schematic_component.list()
  expect(schComponents).toMatchInlineSnapshot(`
    [
      {
        "center": {
          "x": 0,
          "y": 0,
        },
        "schematic_component_id": "schematic_component_0",
        "schematic_group_id": "schematic_group_0",
        "size": {
          "height": 0.388910699999999,
          "width": 1.0583332999999997,
        },
        "source_component_id": "source_component_0",
        "symbol_display_value": "100Ω",
        "symbol_name": "boxresistor_right",
        "type": "schematic_component",
      },
      {
        "center": {
          "x": 0,
          "y": 0,
        },
        "schematic_component_id": "schematic_component_1",
        "schematic_group_id": "schematic_group_0",
        "size": {
          "height": 0.388910699999999,
          "width": 1.0583332999999997,
        },
        "source_component_id": "source_component_1",
        "symbol_display_value": "100Ω",
        "symbol_name": "boxresistor_right",
        "type": "schematic_component",
      },
      {
        "center": {
          "x": 0,
          "y": 0,
        },
        "schematic_component_id": "schematic_component_2",
        "schematic_group_id": "schematic_group_1",
        "size": {
          "height": 0.8400173000000031,
          "width": 1.0583333000000001,
        },
        "source_component_id": "source_component_2",
        "symbol_display_value": "100F",
        "symbol_name": "capacitor_right",
        "type": "schematic_component",
      },
    ]
  `)

  const schGroups = circuit.db.schematic_group.list()
  expect(schGroups).toMatchInlineSnapshot(`
    [
      {
        "center": {
          "x": 0,
          "y": 0,
        },
        "height": 0,
        "is_subcircuit": undefined,
        "name": "G1",
        "schematic_component_ids": [],
        "schematic_group_id": "schematic_group_0",
        "source_group_id": "source_group_0",
        "subcircuit_id": "subcircuit_source_group_0",
        "type": "schematic_group",
        "width": 0,
      },
      {
        "center": {
          "x": 0,
          "y": 0,
        },
        "height": 0,
        "is_subcircuit": true,
        "name": undefined,
        "schematic_component_ids": [],
        "schematic_group_id": "schematic_group_1",
        "source_group_id": "source_group_1",
        "subcircuit_id": "subcircuit_source_group_1",
        "type": "schematic_group",
        "width": 0,
      },
    ]
  `)

  const sourceComponents = circuit.db.source_component.list()
  expect(sourceComponents).toMatchInlineSnapshot(`
    [
      {
        "are_pins_interchangeable": true,
        "display_resistance": "100Ω",
        "ftype": "simple_resistor",
        "manufacturer_part_number": undefined,
        "name": "R1",
        "resistance": 100,
        "source_component_id": "source_component_0",
        "source_group_id": "source_group_0",
        "supplier_part_numbers": undefined,
        "type": "source_component",
      },
      {
        "are_pins_interchangeable": true,
        "display_resistance": "100Ω",
        "ftype": "simple_resistor",
        "manufacturer_part_number": undefined,
        "name": "R2",
        "resistance": 100,
        "source_component_id": "source_component_1",
        "source_group_id": "source_group_0",
        "supplier_part_numbers": undefined,
        "type": "source_component",
      },
      {
        "are_pins_interchangeable": true,
        "capacitance": 100,
        "display_capacitance": "100F",
        "ftype": "simple_capacitor",
        "manufacturer_part_number": undefined,
        "max_decoupling_trace_length": undefined,
        "max_voltage_rating": undefined,
        "name": "C1",
        "source_component_id": "source_component_2",
        "source_group_id": "source_group_1",
        "supplier_part_numbers": undefined,
        "type": "source_component",
      },
    ]
  `)

  const sourceGroups = circuit.db.source_group.list()
  expect(sourceGroups).toMatchInlineSnapshot(`
    [
      {
        "is_subcircuit": undefined,
        "name": "G1",
        "source_group_id": "source_group_0",
        "subcircuit_id": "subcircuit_source_group_0",
        "type": "source_group",
      },
      {
        "is_subcircuit": true,
        "name": undefined,
        "source_group_id": "source_group_1",
        "subcircuit_id": "subcircuit_source_group_1",
        "type": "source_group",
      },
    ]
  `)

  const pcbComponents = circuit.db.pcb_component.list()
  expect(pcbComponents).toMatchInlineSnapshot(`
    [
      {
        "center": {
          "x": 0,
          "y": 0,
        },
        "height": 0.6000000000000001,
        "layer": "top",
        "pcb_component_id": "pcb_component_0",
        "pcb_group_id": "pcb_group_0",
        "rotation": 0,
        "source_component_id": "source_component_0",
        "subcircuit_id": "subcircuit_source_group_1",
        "type": "pcb_component",
        "width": 1.6,
      },
      {
        "center": {
          "x": 0,
          "y": 0,
        },
        "height": 0.6000000000000001,
        "layer": "top",
        "pcb_component_id": "pcb_component_1",
        "pcb_group_id": "pcb_group_0",
        "rotation": 0,
        "source_component_id": "source_component_1",
        "subcircuit_id": "subcircuit_source_group_1",
        "type": "pcb_component",
        "width": 1.6,
      },
      {
        "center": {
          "x": 0,
          "y": 0,
        },
        "height": 0.6000000000000001,
        "layer": "top",
        "pcb_component_id": "pcb_component_2",
        "rotation": 0,
        "source_component_id": "source_component_2",
        "subcircuit_id": "subcircuit_source_group_1",
        "type": "pcb_component",
        "width": 1.6,
      },
    ]
  `)

  const pcbGroups = circuit.db.pcb_group.list()
  expect(pcbGroups).toMatchInlineSnapshot(`
    [
      {
        "center": {
          "x": 0,
          "y": 0,
        },
        "height": 0,
        "is_subcircuit": undefined,
        "name": "G1",
        "pcb_component_ids": [],
        "pcb_group_id": "pcb_group_0",
        "source_group_id": "source_group_0",
        "subcircuit_id": "subcircuit_source_group_0",
        "type": "pcb_group",
        "width": 0,
      },
    ]
  `)
})
