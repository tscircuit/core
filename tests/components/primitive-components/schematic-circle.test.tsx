import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SchematicCircle Test", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        symbol={
          <symbol>
            <schematiccircle center={{ x: 1, y: 2 }} radius={3} isFilled />
          </symbol>
        }
      />
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()
  const schematicComponent = circuitJson.filter(
    (c) => c.type === "schematic_component",
  )
  expect(schematicComponent).toMatchInlineSnapshot(`
    [
      {
        "center": {
          "x": 1,
          "y": 2,
        },
        "is_box_with_pins": false,
        "schematic_component_id": "schematic_component_0",
        "schematic_group_id": "schematic_group_0",
        "size": {
          "height": 6,
          "width": 6,
        },
        "source_component_id": "source_component_0",
        "symbol_display_value": undefined,
        "type": "schematic_component",
      },
    ]
  `)

  const schematicCircles = circuitJson.filter(
    (c) => c.type === "schematic_circle",
  )
  expect(schematicCircles).toMatchInlineSnapshot(`
    [
      {
        "center": {
          "x": 1,
          "y": 2,
        },
        "color": "rgba(132, 0, 0)",
        "fill_color": undefined,
        "is_dashed": false,
        "is_filled": true,
        "radius": 3,
        "schematic_circle_id": "schematic_circle_0",
        "schematic_component_id": "schematic_component_0",
        "schematic_symbol_id": "schematic_symbol_0",
        "stroke_width": 0.12,
        "subcircuit_id": "subcircuit_source_group_0",
        "type": "schematic_circle",
      },
    ]
  `)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
