import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematic rectangles preserve explicit fillColor in circuit JSON", async () => {
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

  const circuitJson = circuit.getCircuitJson()
  const jsonRects = circuitJson.filter((el) => el.type === "schematic_rect")
  expect(jsonRects).toHaveLength(3)
  expect(jsonRects[0].fill_color).toBe("#FFFFFF")
  expect(jsonRects[1].fill_color).toBeUndefined()
  expect(jsonRects[2].fill_color).toBe("#FFCC00")
})
