import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SchematicRect preserves fillColor in circuit JSON", () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })

  circuit.add(
    <board>
      <chip
        name="U1"
        symbol={
          <symbol>
            <schematicrect
              schX={0}
              schY={0}
              width={2}
              height={1}
              color="#3355ff"
              isFilled
              fillColor="#ffaa00"
            />
          </symbol>
        }
      />
    </board>,
  )

  circuit.render()

  const rects = circuit.db.schematic_rect.list()
  expect(rects).toHaveLength(1)
  expect(rects[0]?.color).toBe("#3355ff")
  expect(rects[0]?.is_filled).toBe(true)
  expect(rects[0]?.fill_color).toBe("#ffaa00")
})
