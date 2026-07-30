import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { ESP32_S3_WROOM_1_N16R8 } from "./imports/ESP32_S3_WROOM_1_N16R8"

const ESP32Testpoint = () => (
  <board name="ESP32_Testpoint" schAutoLayoutEnabled>
    <ESP32_S3_WROOM_1_N16R8
      name="U1"
      schWidth={2.4}
      schHeight={5}
      schX={0.42}
      schY={0}
    />

    <resistor
      name="R_EN"
      resistance="10k"
      footprint="0603"
      schX={-2.67}
      schY={4.3}
    />
    <capacitor
      name="C_EN"
      capacitance="1uF"
      footprint="0603"
      schX={-2.67}
      schY={3}
      schOrientation="vertical"
    />
    {/* <pushbutton
      name="SW_RESET"
      footprint="pushbutton_4pin_6x6"
      schX={-2.68}
      schY={1.53}
    />  */}
    <pushbutton
      name="SW_BOOT"
      footprint="pushbutton_4pin_6x6"
      schX={2.61}
      schY={-2.57}
    />

    <testpoint name="TP_LED_DATA" footprintVariant="pad" padDiameter="1.2mm" />
    <testpoint name="TCH1" footprintVariant="pad" padDiameter="7mm" />
    <testpoint name="TCH2" footprintVariant="pad" padDiameter="7mm" />
    <testpoint name="TCH3" footprintVariant="pad" padDiameter="7mm" />
    <testpoint name="TCH4" footprintVariant="pad" padDiameter="7mm" />
    <testpoint name="TCH5" footprintVariant="pad" padDiameter="7mm" />

    <trace from=".U1 > .3V3" to="net.V3V3" />
    <trace from=".U1 > .GND1" to="net.GND" />
    <trace from=".U1 > .GND2" to="net.GND" />
    <trace from=".U1 > .GND3" to="net.GND" />

    <trace from=".U1 > .EN" to=".R_EN > .pin1" />
    <trace from=".R_EN > .pin2" to="net.V3V3" />
    <trace from=".U1 > .EN" to=".C_EN > .pin1" />
    <trace from=".C_EN > .pin2" to="net.GND" />
    <trace from=".U1 > .EN" to=".SW_RESET > .pin1" />
    <trace from=".SW_RESET > .pin2" to="net.GND" />

    <trace from=".U1 > .IO0" to=".SW_BOOT > .pin1" />
    <trace from=".SW_BOOT > .pin2" to="net.GND" />

    <trace from=".U1 > .IO4" to=".TCH1 > .pin1" />
    <trace from=".U1 > .IO5" to=".TCH2 > .pin1" />
    <trace from=".U1 > .IO6" to=".TCH3 > .pin1" />
    <trace from=".U1 > .IO7" to=".TCH4 > .pin1" />
    <trace from=".U1 > .IO15" to=".TCH5 > .pin1" />

    <trace from=".U1 > .IO21" to=".TP_LED_DATA > .pin1" />
  </board>
)

test("repro163: ESP32 testpoints retain a readable auto-layout", async () => {
  const { circuit } = getTestFixture()

  circuit.add(<ESP32Testpoint />)
  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
