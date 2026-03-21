import { it, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("repro67: pinheader default facingDirection for autolayout", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <pinheader name="P1" pinCount={4} />
      <pinheader name="P2" pinCount={4} />
      <trace from="P1.pin1" to="P2.pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
