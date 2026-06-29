import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SchematicArc Test", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        symbol={
          <symbol>
            <schematicarc
              center={{ x: 0, y: 0 }}
              radius={5}
              startAngleDegrees={0}
              endAngleDegrees={180}
            />
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
      x: 0,
      y: 2.5,
    },
    is_box_with_pins: false,
    size: {
      height: 5,
      width: 10,
    },
    type: "schematic_component",
  })

  const schematicArcs = circuitJson.filter((c) => c.type === "schematic_arc")
  expect(schematicArcs).toHaveLength(1)
  expect(schematicArcs[0]).toMatchObject({
    center: {
      x: 0,
      y: 0,
    },
    direction: "counterclockwise",
    end_angle_degrees: 180,
    is_dashed: false,
    radius: 5,
    start_angle_degrees: 0,
    type: "schematic_arc",
  })

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
