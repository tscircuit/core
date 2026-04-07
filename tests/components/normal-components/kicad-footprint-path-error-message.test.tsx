import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("footprint with KiCad-style path without prefix gives helpful error", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <capacitor
        name="C1"
        capacitance="1000pF"
        footprint="Crystal/Crystal_HC50_Vertical"
      />
    </board>,
  )

  circuit.render()

  const errors = circuit.db.source_failed_to_create_component_error.list()
  expect(errors.length).toBeGreaterThan(0)
  const error = errors[0]
  expect(error.message).toContain("looks like a KiCad library path")
  expect(error.message).toContain('Add the "kicad:" prefix')
  expect(error.message).toContain(
    'footprint="kicad:Crystal/Crystal_HC50_Vertical"',
  )
})
