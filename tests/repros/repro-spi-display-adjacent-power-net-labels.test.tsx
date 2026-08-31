import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro: SPI display GND label overlaps the adjacent P3V3 connection", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(
    <board routingDisabled>
      <chip
        name="SPI1_DISPLAY"
        manufacturerPartNumber="SM06B-SRSS-TB(LF)(SN)"
        schPinArrangement={{
          rightSide: {
            pins: [6, 5, 4, 3, 2, 1],
            direction: "top-to-bottom",
          },
        }}
        connections={{
          pin6: "net.SPI1_CS0",
          pin5: "net.SPI1_MISO",
          pin4: "net.SPI1_MOSI",
          pin3: "net.SPI1_CLK",
          pin2: "net.GND",
          pin1: "net.P3V3",
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
