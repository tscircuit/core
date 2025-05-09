import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
test("Schematic box with no pin labels", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip footprint={"0805"} name="U1" />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
