import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SchematicRect preserves fillColor in schematic_rect circuit JSON", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="8mm" routingDisabled>
      <chip
        name="U1"
        footprint="dip2"
        symbol={
          <symbol>
            <schematicrect
              schX={0}
              schY={1.5}
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

  const schematic_rect = circuit.db.schematic_rect.list()[0]!
  expect(schematic_rect).toBeDefined()
  expect(schematic_rect).toMatchObject({
    type: "schematic_rect",
    color: "#880000",
    is_filled: true,
    fill_color: "#FFFFFF",
  })
})
