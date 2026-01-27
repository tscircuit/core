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
              points={[]}
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
  const schematicPaths = circuitJson.filter((c) => c.type === "schematic_path")

  // SVG path is converted to points, so we should have a schematic_path with points
  expect(schematicPaths).toHaveLength(1)
  expect(schematicPaths[0]).toMatchObject({
    type: "schematic_path",
    is_filled: false,
    stroke_color: "#000000",
    stroke_width: 0.05,
  })

  // Verify points were generated from the SVG path
  const points = (schematicPaths[0] as any).points
  expect(Array.isArray(points)).toBe(true)
  expect(points.length).toBeGreaterThan(2)

  // Verify first point is at origin (M 0 0)
  expect(points[0].x).toBeCloseTo(0, 1)
  expect(points[0].y).toBeCloseTo(0, 1)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
