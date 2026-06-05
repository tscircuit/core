import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SchematicPath supports dash_length and dash_gap for svg subpaths", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        symbol={
          <symbol>
            <schematicpath
              svgPath="M -2 -2 L 2 -2 L 2 2 L -2 2 Z M -1 -1 L 1 -1 L 1 1 L -1 1 Z"
              strokeColor="#000000"
              isFilled={false}
              strokeWidth={0.05}
              dashLength={0.3}
              dashGap={0.15}
            />
          </symbol>
        }
      />
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()
  const schematicPaths = circuitJson.filter((c) => c.type === "schematic_path")

  expect(schematicPaths).toHaveLength(2)
  expect(schematicPaths).toMatchInlineSnapshot(`
    [
      {
        "dash_gap": 0.15,
        "dash_length": 0.3,
        "fill_color": undefined,
        "is_dashed": true,
        "is_filled": false,
        "points": [
          {
            "x": -2,
            "y": -2,
          },
          {
            "x": 2,
            "y": -2,
          },
          {
            "x": 2,
            "y": 2,
          },
          {
            "x": -2,
            "y": 2,
          },
          {
            "x": -2,
            "y": -2,
          },
        ],
        "schematic_component_id": "schematic_component_0",
        "schematic_path_id": "schematic_path_0",
        "schematic_symbol_id": "schematic_symbol_0",
        "stroke_color": "#000000",
        "stroke_width": 0.05,
        "subcircuit_id": "subcircuit_source_group_0",
        "type": "schematic_path",
      },
      {
        "dash_gap": 0.15,
        "dash_length": 0.3,
        "fill_color": undefined,
        "is_dashed": true,
        "is_filled": false,
        "points": [
          {
            "x": -1,
            "y": -1,
          },
          {
            "x": 1,
            "y": -1,
          },
          {
            "x": 1,
            "y": 1,
          },
          {
            "x": -1,
            "y": 1,
          },
          {
            "x": -1,
            "y": -1,
          },
        ],
        "schematic_component_id": "schematic_component_0",
        "schematic_path_id": "schematic_path_1",
        "schematic_symbol_id": "schematic_symbol_0",
        "stroke_color": "#000000",
        "stroke_width": 0.05,
        "subcircuit_id": "subcircuit_source_group_0",
        "type": "schematic_path",
      },
    ]
  `)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
