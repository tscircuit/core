import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SchematicArc Test", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        symbol={
          <symbol>
            <schematicarc
              center={{ x: 0, y: 0 }}
              radius={5}
              startAngleDegrees={0}
              endAngleDegrees={180}
            />
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
          "x": 0,
          "y": 0,
        },
        "is_box_with_pins": false,
        "schematic_component_id": "schematic_component_0",
        "schematic_group_id": "schematic_group_0",
        "size": {
          "height": 5,
          "width": 10,
        },
        "source_component_id": "source_component_0",
        "symbol_display_value": undefined,
        "type": "schematic_component",
      },
    ]
  `)

  const schematicArcs = circuitJson.filter((c) => c.type === "schematic_arc")
  expect(schematicArcs).toMatchInlineSnapshot(`
    [
      {
        "center": {
          "x": 0,
          "y": 0,
        },
        "color": "rgba(132, 0, 0)",
        "direction": "counterclockwise",
        "end_angle_degrees": 180,
        "is_dashed": false,
        "radius": 5,
        "schematic_arc_id": "schematic_arc_0",
        "schematic_component_id": "schematic_component_0",
        "start_angle_degrees": 0,
        "stroke_width": 0.12,
        "subcircuit_id": "subcircuit_source_group_0",
        "type": "schematic_arc",
      },
    ]
  `)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
