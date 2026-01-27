import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SchematicPath with svgPath containing multiple subpaths", () => {
  const { circuit } = getTestFixture()

  // SVG path with two separate subpaths (two M commands)
  const multiSubpathSvg = "M 0 0 L 2 0 L 2 2 M 4 0 L 6 0 L 6 2"

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        symbol={
          <symbol>
            <schematicpath
              points={[]}
              svgPath={multiSubpathSvg}
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

  // Should create two separate schematic_path entries, one for each subpath
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

  // Verify first subpath starts at origin (M 0 0)
  const firstPathPoints = (schematicPaths[0] as any).points
  expect(firstPathPoints[0].x).toBeCloseTo(0, 1)
  expect(firstPathPoints[0].y).toBeCloseTo(0, 1)

  // Verify second subpath starts at (4, 0) from M 4 0
  const secondPathPoints = (schematicPaths[1] as any).points
  expect(secondPathPoints[0].x).toBeCloseTo(4, 1)
  expect(secondPathPoints[0].y).toBeCloseTo(0, 1)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
