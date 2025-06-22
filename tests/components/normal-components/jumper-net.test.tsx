import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { sel } from "lib/sel"

test("jumper with net connections", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <jumper name="U1" manufacturerPartNumber="I2C_SENSOR" footprint="soic5" />
      <netlabel net="VCC" connectsTo="U1.pin1" schX={1.4} schY={1} />
      <netlabel net="EN" connectsTo="U1.pin2" schX={2} schY={0.5} />
      <netlabel net="MISO" connectsTo="U1.pin3" schX={2.2} schY={0} />
      <netlabel net="MOSI" connectsTo="U1.pin4" schX={2.4} schY={-0.5} />
      <netlabel net="GND" connectsTo="U1.pin5" schX={1} schY={-1} />
    </board>,
  )

  circuit.render()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
