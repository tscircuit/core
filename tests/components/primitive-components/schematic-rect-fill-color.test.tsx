import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SchematicRect preserves fillColor", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        symbol={
          <symbol>
            <schematicrect
              width={4}
              height={2}
              color="#880000"
              isFilled
              fillColor="#FFFFFF"
            />
          </symbol>
        }
      />
    </board>,
  )

  circuit.render()

  expect(circuit.db.schematic_rect.list()).toMatchObject([
    {
      type: "schematic_rect",
      color: "#880000",
      is_filled: true,
      fill_color: "#FFFFFF",
    },
  ])

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
