import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematic rectangles preserve explicit fill without changing fallback or unfilled rendering", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm" routingDisabled>
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
            <schematicrect
              schX={0}
              width={4}
              height={2}
              color="#008800"
              isFilled
            />
            <schematicrect
              schX={5}
              width={4}
              height={2}
              color="#000088"
              isFilled={false}
              fillColor="#FFCC00"
            />
            <schematictext text="White fill" schX={-5} schY={2} />
            <schematictext text="Stroke fallback" schX={0} schY={2} />
            <schematictext text="Unfilled" schX={5} schY={2} />
          </symbol>
        }
      />
    </board>,
  )

  circuit.render()

  const rectangles = circuit.db.schematic_rect.list()
  expect(rectangles).toHaveLength(3)
  expect(rectangles[0]).toMatchObject({
    color: "#880000",
    is_filled: true,
    fill_color: "#FFFFFF",
  })
  expect(rectangles[1]).toMatchObject({
    color: "#008800",
    is_filled: true,
  })
  expect(rectangles[1].fill_color).toBeUndefined()
  expect(rectangles[2]).toMatchObject({
    color: "#000088",
    is_filled: false,
    fill_color: "#FFCC00",
  })

  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
