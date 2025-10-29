import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematicrect cornerRadius sets corner_radius", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        schematicSymbol={
          <symbol>
            <schematicrect
              width={3}
              height={2}
              cornerRadius={0.25}
              color="blue"
            />
            <schematicrect
              schX={4}
              width={2}
              height={2}
              cornerRadius={0.25}
              isFilled
            />
          </symbol>
        }
      />
    </board>,
  )

  project.render()

  const schematicRects = project.db.schematic_rect.list()
  expect(schematicRects).toHaveLength(2)
  expect(schematicRects[0].corner_radius).toBe(0.25)
  expect(schematicRects[1].corner_radius).toBe(0.25)
})
