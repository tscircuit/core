import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SchematicRect Test", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        schX={5}
        schY={5}
        symbol={
          <symbol>
            <schematicrect
              schX={2}
              schY={3}
              width={6}
              height={4}
              isFilled={false}
            />
          </symbol>
        }
      />
    </board>,
  )

  circuit.render()

  const schematic_component = circuit.db.schematic_component.get(
    circuit.selectOne("chip")?.schematic_component_id!,
  )
  expect(schematic_component).not.toBeNull()
  expect(schematic_component).toMatchObject({
    center: {
      x: 7,
      y: 8,
    },
    is_box_with_pins: false,
    size: {
      height: 4,
      width: 6,
    },
    type: "schematic_component",
  })

  const schematic_rect = circuit.db.schematic_rect.list()[0]!
  expect(schematic_rect).toMatchObject({
    center: {
      x: 7,
      y: 8,
    },
    height: 4,
    is_dashed: false,
    is_filled: false,
    type: "schematic_rect",
    width: 6,
  })

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
