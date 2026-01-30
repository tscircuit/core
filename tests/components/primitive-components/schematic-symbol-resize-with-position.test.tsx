import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SchematicSymbol should resize and position correctly with both schX/schY and width/height", () => {
  const { circuit } = getTestFixture()

  // Create a symbol that:
  // 1. Is positioned at (5, 3) via chip's schX/schY
  // 2. Has width=2, height=2 to scale the 1x1 content to 2x2
  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        schX={5}
        schY={3}
        symbol={
          <symbol width={2} height={2}>
            {/* Original content is a 1x1 unit box from (0,0) to (1,1) */}
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

  // The component should be centered at (5, 3) with size 2x2
  expect(schematicComponent[0].center).toEqual({
    x: 5,
    y: 3,
  })
  expect(schematicComponent[0].size).toEqual({
    width: 2,
    height: 2,
  })

  const schematicLines = circuitJson.filter((c) => c.type === "schematic_line")
  expect(schematicLines).toHaveLength(4)

  // The 1x1 box centered at origin should become a 2x2 box centered at (5, 3)
  // Content originally: (0,0) to (1,1) centered at (0.5, 0.5)
  // After scaling 2x: (-1,-1) to (1,1) centered at (0, 0)
  // After translation to (5, 3): (4, 2) to (6, 4)

  // Bottom edge: original (0,0)-(1,0) -> scaled to (-1,-1)-(1,-1) -> translated to (4,2)-(6,2)
  const bottomLine = schematicLines.find(
    (l: any) => l.y1 === l.y2 && l.y1 < 3,
  ) as any
  expect(bottomLine).toBeDefined()
  expect(bottomLine.x1).toBe(4)
  expect(bottomLine.y1).toBe(2)
  expect(bottomLine.x2).toBe(6)
  expect(bottomLine.y2).toBe(2)

  // Top edge: original (0,1)-(1,1) -> scaled to (-1,1)-(1,1) -> translated to (4,4)-(6,4)
  const topLine = schematicLines.find(
    (l: any) => l.y1 === l.y2 && l.y1 > 3,
  ) as any
  expect(topLine).toBeDefined()
  // The top line goes from (1,1) to (0,1) in original, so after transform:
  // (1,1) -> (6,4), (0,1) -> (4,4)
  expect(topLine.x1).toBe(6)
  expect(topLine.y1).toBe(4)
  expect(topLine.x2).toBe(4)
  expect(topLine.y2).toBe(4)

  // Left edge: original (0,1)-(0,0) -> scaled to (-1,1)-(-1,-1) -> translated to (4,4)-(4,2)
  const leftLine = schematicLines.find(
    (l: any) => l.x1 === l.x2 && l.x1 < 5,
  ) as any
  expect(leftLine).toBeDefined()
  expect(leftLine.x1).toBe(4)
  expect(leftLine.y1).toBe(4)
  expect(leftLine.x2).toBe(4)
  expect(leftLine.y2).toBe(2)

  // Right edge: original (1,0)-(1,1) -> scaled to (1,-1)-(1,1) -> translated to (6,2)-(6,4)
  const rightLine = schematicLines.find(
    (l: any) => l.x1 === l.x2 && l.x1 > 5,
  ) as any
  expect(rightLine).toBeDefined()
  expect(rightLine.x1).toBe(6)
  expect(rightLine.y1).toBe(2)
  expect(rightLine.x2).toBe(6)
  expect(rightLine.y2).toBe(4)
})
