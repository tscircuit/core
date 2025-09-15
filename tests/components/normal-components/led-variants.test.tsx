import { it, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("<Led/> component with color", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <led name="LED1" color="red" schDisplayValue="Red" />
      <led name="LED2" laser color="red" schDisplayValue="Red" schY={-1} />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
