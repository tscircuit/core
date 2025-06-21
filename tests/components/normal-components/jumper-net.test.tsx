import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { sel } from "lib/sel"

test("jumper with net connections", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <jumper
        name="U1"
        manufacturerPartNumber="I2C_SENSOR"
        footprint="soic5"
        connections={{
          pin1: sel.net.VCC,
          pin2: sel.net.EN,
          pin3: sel.net.MISO,
          pin4: sel.net.MOSI,
          pin5: sel.net.GND,
        }}
      />
      <netlabel net="VCC" schX={1} schY={1} />
      <netlabel net="EN" schX={1} schY={0.5} />
      <netlabel net="MISO" schX={1} schY={0} />
      <netlabel net="MOSI" schX={1} schY={-0.5} />
      <netlabel net="GND" schX={1} schY={-1} />
    </board>
  )

  circuit.render()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})