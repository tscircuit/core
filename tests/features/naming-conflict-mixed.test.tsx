import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Multiple components with same names should error", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="1k" footprint="0402" />
      <resistor name="R1" resistance="2k" footprint="0402" />
      <capacitor name="C1" capacitance="100nF" footprint="0402" />
      <capacitor name="C1" capacitance="200nF" footprint="0402" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = circuit.db.source_failed_to_create_component_error.list()
  expect(errors).toHaveLength(2) // One for duplicate resistors, one for duplicate capacitors

  const resistorError = errors.find((e) => e.message.includes("R1"))
  const capacitorError = errors.find((e) => e.message.includes("C1"))

  expect(resistorError).toBeDefined()
  expect(capacitorError).toBeDefined()
  expect(resistorError?.message).toContain("same name already exists")
  expect(capacitorError?.message).toContain("same name already exists")
})

test("Components with different names should not error", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="1k" footprint="0402" />
      <resistor name="R2" resistance="2k" footprint="0402" />
      <capacitor name="C1" capacitance="100nF" footprint="0402" />
      <capacitor name="C2" capacitance="200nF" footprint="0402" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = circuit.db.source_failed_to_create_component_error.list()
  expect(errors).toHaveLength(0)
})
