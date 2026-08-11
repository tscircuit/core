import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const Circuit1 = () => (
  <pinheader
    name="J_NORTH"
    displayName="Conn_North"
    pinCount={10}
    gender="female"
    pitch="2.54mm"
    schX={16}
    schY={1.8}
    schFacingDirection="up"
    showSilkscreenPinLabels
    connections={{
      pin1: "net.QSPI_CS",
      pin2: "net.RESET",
      pin3: "net.SWCLK",
      pin4: "net.SWDIO",
      pin5: "net.USB_D_MINUS",
      pin6: "net.USB_D_PLUS",
      pin7: "net.V3_3",
      pin8: "net.VBUS_5V",
      pin9: "net.VBAT",
      pin10: "net.GND",
    }}
  />
)

test("repro: up-facing pinheader with net connections", async () => {
  const { circuit } = getTestFixture()

  circuit.add(<Circuit1 />)

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
