import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SchematicLine Test", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        symbol={
          <symbol>
            <schematicline x1={0} y1={0} x2={10} y2={10} />
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
          "x": 5,
          "y": 5,
        },
        "is_box_with_pins": false,
        "schematic_component_id": "schematic_component_0",
        "schematic_group_id": "schematic_group_0",
        "size": {
          "height": 10,
          "width": 10,
        },
        "source_component_id": "source_component_0",
        "symbol_display_value": undefined,
        "type": "schematic_component",
      },
    ]
  `)

  const schematicLine = circuitJson.filter((c) => c.type === "schematic_line")
  expect(schematicLine).toMatchInlineSnapshot(`
    [
      {
        "color": "rgba(132, 0, 0)",
        "is_dashed": false,
        "schematic_component_id": "schematic_component_0",
        "schematic_line_id": "schematic_line_0",
        "schematic_symbol_id": "schematic_symbol_0",
        "stroke_width": 0.12,
        "subcircuit_id": "subcircuit_source_group_0",
        "type": "schematic_line",
        "x1": 0,
        "x2": 10,
        "y1": 0,
        "y2": 10,
      },
    ]
  `)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
