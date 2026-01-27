import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SchematicPath with svgPath", () => {
  const { circuit } = getTestFixture()

  // Complex SVG path with lines, quadratic bezier, cubic bezier, and arc
  const complexSvgPath =
    "M 0 0 L 2 0 Q 3 0 3 1 L 3 3 C 3 4 2 5 1 5 L 0 5 A 1 1 0 0 1 -1 4 L -1 1 Z"

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        symbol={
          <symbol>
            <schematicpath
              svgPath={complexSvgPath}
              strokeColor="#000000"
              isFilled={false}
              strokeWidth={0.05}
            />
          </symbol>
        }
      />
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()
  const schematicPath = circuitJson.filter((c) => c.type === "schematic_path")
  expect(schematicPath).toHaveLength(1)
  expect(schematicPath[0]).toMatchObject({
    type: "schematic_path",
    is_filled: false,
    stroke_color: "#000000",
    svg_path: complexSvgPath,
    stroke_width: 0.05,
  })

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
