import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro140: duplicate labels on a multidrop named net", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <resistor name="R8_BATTERY_TOP" resistance="200k" footprint="0402" />

      <trace from="R8_BAT_TOP.pin1" to="net.BAT" />

      <resistor name="R8_BAT" resistance="200k" footprint="0402" />
      <trace from="R8_BAT.pin1" to="net.BAT" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
