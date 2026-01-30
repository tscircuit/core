import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SchematicSymbol should move when chip has schX/schY", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        schX={5}
        schY={3}
        symbol={
          <symbol>
            <schematicline x1={0} y1={0} x2={1} y2={1} />
          </symbol>
        }
      />
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()

  const schematicLine = circuitJson.filter((c) => c.type === "schematic_line")
  expect(schematicLine).toHaveLength(1)

  // The line should be offset by the chip's schX/schY position
  // Line goes from (0,0) to (1,1) relative to symbol origin
  // With schX=5, schY=3, it should go from (5,3) to (6,4)
  expect(schematicLine[0]).toMatchObject({
    x1: 5,
    y1: 3,
    x2: 6,
    y2: 4,
  })

  const schematicComponent = circuitJson.filter(
    (c) => c.type === "schematic_component",
  )
  expect(schematicComponent).toHaveLength(1)
  // The center should be at (5.5, 3.5) - the middle of the line
  expect(schematicComponent[0]).toMatchObject({
    center: {
      x: 5.5,
      y: 3.5,
    },
  })
})
