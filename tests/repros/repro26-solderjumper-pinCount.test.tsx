import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("solderjumper infers pinCount from footprint", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <solderjumper
        name="JP1"
        footprint="solderjumper2_bridged12"
        bridgedPins={[["1", "2"]]}
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
