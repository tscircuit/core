import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("potentiometer schematic", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <potentiometer name="P1" maxResistance="10k" />
    </board>,
  )

  circuit.render()

  expect(circuit.db.schematic_component.list()).toHaveLength(1)
  expect(circuit.db.schematic_port.list()).toHaveLength(2)
})
