import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board with resistor being passed schX and pcbX in mm", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor
        resistance="1k"
        footprint="0402"
        name="R1"
        schX="2mm"
        pcbX="-2mm"
      />
    </board>,
  )

  circuit.render()

  expect(circuit.db.schematic_component.list()).toMatchInlineSnapshot(`
    [
      {
        "center": {
          "x": 2,
          "y": 0,
        },
        "schematic_component_id": "schematic_component_0",
        "schematic_group_id": "schematic_group_0",
        "size": {
          "height": 0.388910699999999,
          "width": 1.0583332999999997,
        },
        "source_component_id": "source_component_0",
        "symbol_display_value": "1kΩ",
        "symbol_name": "boxresistor_right",
        "type": "schematic_component",
      },
    ]
  `)

  expect(circuit.db.pcb_component.list()).toMatchInlineSnapshot(`
    [
      {
        "center": {
          "x": -2,
          "y": 0,
        },
        "height": 0.6,
        "layer": "top",
        "pcb_component_id": "pcb_component_0",
        "rotation": 0,
        "source_component_id": "source_component_0",
        "subcircuit_id": "subcircuit_source_group_0",
        "type": "pcb_component",
        "width": 1.5999999999999999,
      },
    ]
  `)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
