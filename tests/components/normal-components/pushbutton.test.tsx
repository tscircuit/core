import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("<pushbutton /> component", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="10mm">
      <pushbutton name="PB1" footprint="pushbutton" pcbX={0} pcbY={0} />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
