import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SchematicLine Test", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        symbol={
          <symbol>
            <schematicline x1={0} y1={0} x2={10} y2={10} />
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
  expect(schematicComponent[0]).toMatchObject({
    center: {
      x: 5,
      y: 5,
    },
    is_box_with_pins: false,
    size: {
      height: 10,
      width: 10,
    },
    type: "schematic_component",
  })

  const schematicLine = circuitJson.filter((c) => c.type === "schematic_line")
  expect(schematicLine).toHaveLength(1)
  expect(schematicLine[0]).toMatchObject({
    is_dashed: false,
    type: "schematic_line",
    x1: 0,
    x2: 10,
    y1: 0,
    y2: 10,
  })

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
