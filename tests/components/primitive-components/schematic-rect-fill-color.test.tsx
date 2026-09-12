import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematic rectangles preserve explicit fills and existing fill defaults", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={20} height={10} routingDisabled>
      <chip
        name="U1"
        symbol={
          <symbol>
            <schematicrect
              schX={-5}
              width={4}
              height={2}
              color="#880000"
              isFilled
              fillColor="#FFFFFF"
            />
            <schematictext schX={-5} schY={2} text="White fill" />
            <schematicrect width={4} height={2} color="#880000" isFilled />
            <schematictext schY={2} text="Default fill" />
            <schematicrect
              schX={5}
              width={4}
              height={2}
              color="#880000"
              isFilled={false}
              fillColor="#FFFFFF"
            />
            <schematictext schX={5} schY={2} text="Unfilled" />
          </symbol>
        }
      />
    </board>,
  )
  circuit.render()

  const rects = circuit.db.schematic_rect.list()
  expect(rects).toMatchObject([
    { color: "#880000", is_filled: true, fill_color: "#FFFFFF" },
    { color: "#880000", is_filled: true },
    { color: "#880000", is_filled: false, fill_color: "#FFFFFF" },
  ])
  expect(rects[1].fill_color).toBeUndefined()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
