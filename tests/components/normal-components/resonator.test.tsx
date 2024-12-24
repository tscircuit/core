import { it, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("should render a resonator with 3pin footprint", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resonator
        name="R1"
        frequency="1MHz"
        loadCapacitance="20pF"
        pinVariant="3pin"
        footprint="resonator_3pin_f1MHz_cl20pF"
        schRotation={90}
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
