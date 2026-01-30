import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SchematicSymbol should scale contents when width/height are provided", () => {
  const { circuit } = getTestFixture()

  // Create a symbol with contents that go from (0,0) to (1,1)
  // but specify width=2, height=2 on the symbol
  // The contents should be scaled to fit the 2x2 area
  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        symbol={
          <symbol width={2} height={2}>
            {/* Original content is a 1x1 unit box */}
            <schematicline x1={0} y1={0} x2={1} y2={0} />
            <schematicline x1={1} y1={0} x2={1} y2={1} />
            <schematicline x1={1} y1={1} x2={0} y2={1} />
            <schematicline x1={0} y1={1} x2={0} y2={0} />
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
  expect(schematicComponent).toHaveLength(1)

  // The size of the component should match the symbol width/height
  expect(schematicComponent[0].size).toEqual({
    width: 2,
    height: 2,
  })

  const schematicLines = circuitJson.filter((c) => c.type === "schematic_line")
  expect(schematicLines).toHaveLength(4)

  // When width=2, height=2 is specified, the contents should be scaled 2x
  // So the original 1x1 box should become a 2x2 box
  // Lines are centered around origin, so:
  // - Original bounding box: (0,0) to (1,1), center at (0.5, 0.5)
  // - Scaled bounding box: (-1,-1) to (1,1), center at (0,0)
  // Actually, the scaling should preserve center at origin (0,0)
  // Content originally spans from 0 to 1, scaled 2x should span -1 to 1
  // (centered at 0)

  // Bottom edge: (0,0) to (1,0) -> scaled and centered: (-1,-1) to (1,-1)
  const bottomLine = schematicLines.find(
    (l: any) => l.y1 === l.y2 && l.y1 < 0,
  ) as any
  expect(bottomLine).toBeDefined()
  expect(bottomLine.x1).toBe(-1)
  expect(bottomLine.y1).toBe(-1)
  expect(bottomLine.x2).toBe(1)
  expect(bottomLine.y2).toBe(-1)

  // Top edge: (0,1) to (1,1) -> scaled and centered: (-1,1) to (1,1)
  const topLine = schematicLines.find(
    (l: any) => l.y1 === l.y2 && l.y1 > 0,
  ) as any
  expect(topLine).toBeDefined()
  expect(topLine.x1).toBe(1)
  expect(topLine.y1).toBe(1)
  expect(topLine.x2).toBe(-1)
  expect(topLine.y2).toBe(1)
})
