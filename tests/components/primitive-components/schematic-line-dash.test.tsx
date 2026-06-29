import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SchematicLine supports dash_length and dash_gap", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        symbol={
          <symbol>
            <schematicline
              x1={0}
              y1={0}
              x2={10}
              y2={10}
              dashLength={0.4}
              dashGap={0.2}
            />
          </symbol>
        }
      />
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()
  const schematicLines = circuitJson.filter((c) => c.type === "schematic_line")

  expect(schematicLines).toHaveLength(1)
  expect(schematicLines[0]).toMatchObject({
    dash_gap: 0.2,
    dash_length: 0.4,
    is_dashed: true,
    type: "schematic_line",
    x1: 0,
    x2: 10,
    y1: 0,
    y2: 10,
  })
})
