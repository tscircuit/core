import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("string cadModel with an unsupported extension records an error instead of crashing the render", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint="soic8"
        pcbX={0}
        pcbY={0}
        cadModel="https://example.com/chip.xyz"
      />
    </board>,
  )

  // The render must complete instead of throwing.
  project.render()

  expect(project.db.cad_component.list()).toHaveLength(0)

  const errors = project.db.external_footprint_load_error.list()
  expect(errors).toHaveLength(1)
  expect(errors[0].message).toContain("chip.xyz")

  // The rest of the circuit still renders.
  expect(project.db.pcb_component.list()).toHaveLength(1)
})
