import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Visual companion to diode-variant-prop-symbol: the `variant` enum spelling
// must render the same specialised diode symbols the boolean shortcuts do.
test("diode variant prop renders variant schematic symbols", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="20mm">
      <diode name="D1" variant="schottky" schY={2} />
      <diode name="D2" variant="zener" schY={0} />
      <diode name="D3" variant="avalanche" schY={-2} />
      <diode name="D4" variant="photo" schY={-4} />
    </board>,
  )
  circuit.render()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
