import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SchematicRect Test", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        schX={5}
        schY={5}
        symbol={
          <symbol>
            <schematicrect
              schX={2}
              schY={3}
              width={6}
              height={4}
              isFilled={false}
            />
          </symbol>
        }
      />
    </board>,
  )

  circuit.render()

  const schematic_component = circuit.db.schematic_component.get(
    circuit.selectOne("chip")?.schematic_component_id!,
  )
  expect(schematic_component).not.toBeNull()
  expect(schematic_component).toMatchInlineSnapshot(`
    {
      "center": {
        "x": 7,
        "y": 8,
      },
      "is_box_with_pins": false,
      "schematic_component_id": "schematic_component_0",
      "schematic_group_id": "schematic_group_0",
      "size": {
        "height": 4,
        "width": 6,
      },
      "source_component_id": "source_component_0",
      "symbol_display_value": undefined,
      "type": "schematic_component",
    }
  `)

  const schematic_rect = circuit.db.schematic_rect.list()[0]!
  expect(schematic_rect).toMatchInlineSnapshot(`
    {
      "center": {
        "x": 7,
        "y": 8,
      },
      "color": "rgba(132, 0, 0)",
      "height": 4,
      "is_dashed": false,
      "is_filled": false,
      "rotation": 0,
      "schematic_component_id": "schematic_component_0",
      "schematic_rect_id": "schematic_rect_0",
      "schematic_symbol_id": "schematic_symbol_0",
      "stroke_width": 0.12,
      "subcircuit_id": "subcircuit_source_group_0",
      "type": "schematic_rect",
      "width": 6,
    }
  `)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
