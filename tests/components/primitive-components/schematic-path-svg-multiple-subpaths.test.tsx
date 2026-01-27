import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SchematicPath with svgPath containing multiple subpaths", () => {
  const { circuit } = getTestFixture()

  // Square within a square - two completely separated closed paths
  // Outer square: 4x4 centered at origin
  // Inner square: 2x2 centered at origin
  const squareWithinSquare = [
    "M -2 -2 L 2 -2 L 2 2 L -2 2 Z", // Outer square
    "M -1 -1 L 1 -1 L 1 1 L -1 1 Z", // Inner square
  ].join(" ")

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        symbol={
          <symbol>
            <schematicpath
              svgPath={squareWithinSquare}
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

  // Should create two separate schematic_path entries, one for each square
  expect(schematicPaths).toHaveLength(2)

  // Verify both paths have the same styling
  for (const path of schematicPaths) {
    expect(path).toMatchObject({
      type: "schematic_path",
      is_filled: false,
      stroke_color: "#000000",
      stroke_width: 0.05,
    })

    // Verify points were generated
    const points = (path as any).points
    expect(Array.isArray(points)).toBe(true)
    expect(points.length).toBeGreaterThan(2)
  }

  // Verify outer square starts at (-2, -2)
  const outerSquarePoints = (schematicPaths[0] as any).points
  expect(outerSquarePoints[0].x).toBeCloseTo(-2, 1)
  expect(outerSquarePoints[0].y).toBeCloseTo(-2, 1)

  // Verify inner square starts at (-1, -1)
  const innerSquarePoints = (schematicPaths[1] as any).points
  expect(innerSquarePoints[0].x).toBeCloseTo(-1, 1)
  expect(innerSquarePoints[0].y).toBeCloseTo(-1, 1)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
