import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SchematicCircle Test", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        symbol={
          <symbol>
            <schematiccircle center={{ x: 1, y: 2 }} radius={3} isFilled />
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
      x: 1,
      y: 2,
    },
    is_box_with_pins: false,
    size: {
      height: 6,
      width: 6,
    },
    type: "schematic_component",
  })

  const schematicCircles = circuitJson.filter(
    (c) => c.type === "schematic_circle",
  )
  expect(schematicCircles).toHaveLength(1)
  expect(schematicCircles[0]).toMatchObject({
    center: {
      x: 1,
      y: 2,
    },
    is_dashed: false,
    is_filled: true,
    radius: 3,
    type: "schematic_circle",
  })

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
