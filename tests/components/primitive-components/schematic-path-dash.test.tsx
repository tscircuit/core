import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SchematicPath supports dash_length and dash_gap", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        symbol={
          <symbol>
            <schematicpath
              points={[
                { x: 0, y: 0 },
                { x: 5, y: 0 },
                { x: 5, y: 5 },
                { x: 0, y: 5 },
                { x: 0, y: 0 },
              ]}
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
            "x": 0,
            "y": 0,
          },
          {
            "x": 5,
            "y": 0,
          },
          {
            "x": 5,
            "y": 5,
          },
          {
            "x": 0,
            "y": 5,
          },
          {
            "x": 0,
            "y": 0,
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
    ]
  `)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
