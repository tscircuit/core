import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("components with the same name should create a failed_to_create error", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={2} pcbY={2} />
      <resistor name="R1" resistance="20k" footprint="0402" pcbX={5} pcbY={5} />
    </board>,
  )

  circuit.render()
  const errors = circuit.db.source_failed_to_create_component_error.list()
  expect(errors).toHaveLength(1)
  const error = errors[0]
  expect(error.error_type).toBe("source_failed_to_create_component_error")
  expect(error.message).toMatch(/Component with name "R1" already exists/)
})

test("components with different names should not create errors", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={2} pcbY={2} />
      <resistor name="R2" resistance="20k" footprint="0402" pcbX={5} pcbY={5} />
    </board>,
  )

  circuit.render()

  const errors = circuit.db.source_failed_to_create_component_error.list()
  expect(errors).toHaveLength(0)
})
