import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const pinLabels = {
  pin1: ["CLK32K"],
  pin2: ["VCC"],
  pin3: ["INT_SQW"],
  pin4: ["RST"],
  pin5: ["GND"],
  pin6: ["VBAT"],
  pin7: ["SDA"],
  pin8: ["SCL"],
} as const

const OpenSmartwatchRtc = () => (
  <board routingDisabled schMaxTraceDistance="4mm">
    <chip
      name="U1"
      manufacturerPartNumber="DS3231MZ+"
      pinLabels={pinLabels}
      schX={0}
      schY={5}
      schWidth={3.2}
      schHeight={3.6}
      schPinArrangement={{
        leftSide: {
          direction: "top-to-bottom",
          pins: ["SCL", "SDA", "RST"],
        },
        rightSide: {
          direction: "top-to-bottom",
          pins: ["VBAT", "CLK32K", "INT_SQW"],
        },
        topSide: { direction: "left-to-right", pins: ["VCC"] },
        bottomSide: { direction: "left-to-right", pins: ["GND"] },
      }}
      connections={{
        VCC: "net.V3V3",
        VBAT: "net.V3V3",
        INT_SQW: "net.RTC_INT",
        SDA: "net.SDA",
        SCL: "net.SCL",
        GND: "net.GND",
      }}
      noConnect={["CLK32K", "RST"]}
    />

    <capacitor
      name="C11"
      capacitance="0.1uF"
      schX={-3}
      schY={0}
      connections={{ pin1: "net.V3V3", pin2: "net.GND" }}
    />
    <resistor
      name="R18"
      resistance="2.2kohm"
      schX={1}
      schY={0}
      connections={{ pin1: "net.RTC_INT", pin2: "net.V3V3" }}
    />
  </board>
)

test("repro: open smartwatch DS3231MZ+ RTC schematic", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(<OpenSmartwatchRtc />)
  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
