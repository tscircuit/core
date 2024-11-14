import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("potentiometer schematic", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <potentiometer name="P1" maxResistance="10k" schX={0} schY={0} schRotation={0} />
      <potentiometer name="P2" maxResistance="10k" schX={2} schY={0} schRotation={90} />
      <potentiometer name="P3" maxResistance="10k" schX={4} schY={0} schRotation={180} />
      <potentiometer name="P4" maxResistance="10k" schX={6} schY={0} schRotation={270} />
    </board>,
  )

  circuit.render()

  expect(circuit.db.schematic_component.list()).toHaveLength(4)
  expect(circuit.db.schematic_port.list()).toHaveLength(8)

  expect(circuit.getCircuitJson()).toMatchSchematicSnapshot(import.meta.path)
})
