import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro83: panel with multiple boards without pcbX/pcbY and layoutMode=none should produce pcb_placement_error", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel layoutMode="none">
      <board width="10mm" height="10mm">
        <resistor name="R1" resistance="10k" footprint="0402" />
      </board>
      <board width="10mm" height="10mm">
        <resistor name="R2" resistance="10k" footprint="0402" />
      </board>
    </panel>,
  )

  circuit.render()

  const errors = circuit.db.pcb_placement_error.list()
  expect(errors.length).toBe(1)
  expect(errors[0].message).toContain(
    "Multiple boards in panel without pcbX/pcbY positions",
  )
  expect(errors[0].message).toContain('layoutMode="none"')
  expect(errors[0].message).toContain('layoutMode="grid"')
})
