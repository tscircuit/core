import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const ROWS = 12
const COLS = 12
const LED_COUNT = ROWS * COLS

const WLED = ({ name }: { name: string }) => (
  <chip
    name={name}
    manufacturerPartNumber="XL_5050RGBC_2812B_S"
    pinLabels={{
      pin1: ["VDD"],
      pin2: ["DO"],
      pin3: ["GND"],
      pin4: ["DI"],
    }}
    pinAttributes={{
      VDD: { requiresPower: true, requiresVoltage: "5V" },
      DO: { isGpio: true },
      GND: { requiresGround: true },
      DI: { isGpio: true },
    }}
  />
)

test("repro159: matchpack lays out a 12x12 WLED matrix schematic", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <net name="V5" isPowerNet />
      <net name="GND" isGroundNet />

      <chip
        name="U1"
        manufacturerPartNumber="Seeed Studio XIAO ESP32-C3"
        pinLabels={{
          pin1: "D0_GPIO2",
          pin2: "D1_GPIO3",
          pin3: "D2_GPIO4",
          pin4: "D3_GPIO5",
          pin5: "D4_GPIO6",
          pin6: "D5_GPIO7",
          pin7: "D6_GPIO21",
          pin8: "D7_GPIO20",
          pin9: "D8_GPIO8",
          pin10: "D9_GPIO9",
          pin11: "D10_GPIO10",
          pin12: "3V3",
          pin13: "GND",
          pin14: "5V",
        }}
        pinAttributes={{
          D4_GPIO6: { isGpio: true },
          GND: { requiresGround: true },
          "5V": { requiresPower: true, requiresVoltage: "5V" },
          "3V3": { providesPower: true, providesVoltage: "3.3V" },
        }}
      />
      <resistor name="RDATA" resistance="330" />
      <capacitor name="CBULK" capacitance="1000uF" polarized />

      <trace from=".U1 > .pin14" to="net.V5" />
      <trace from=".U1 > .pin13" to="net.GND" />
      <trace from=".U1 > .pin5" to=".RDATA > .pin1" />
      <trace from=".RDATA > .pin2" to=".D1 > .DI" />
      <trace from=".CBULK > .pos" to="net.V5" />
      <trace from=".CBULK > .neg" to="net.GND" />

      {Array.from({ length: LED_COUNT }, (_, ledIndex) => (
        <WLED key={`D${ledIndex + 1}`} name={`D${ledIndex + 1}`} />
      ))}

      {Array.from({ length: LED_COUNT - 1 }, (_, ledIndex) => (
        <trace
          key={`data-${ledIndex + 1}`}
          from={`.D${ledIndex + 1} > .DO`}
          to={`.D${ledIndex + 2} > .DI`}
        />
      ))}

      {Array.from({ length: LED_COUNT }, (_, ledIndex) => (
        <trace
          key={`v5-${ledIndex + 1}`}
          from={`.D${ledIndex + 1} > .VDD`}
          to="net.V5"
        />
      ))}
      {Array.from({ length: LED_COUNT }, (_, ledIndex) => (
        <trace
          key={`gnd-${ledIndex + 1}`}
          from={`.D${ledIndex + 1} > .GND`}
          to="net.GND"
        />
      ))}

      {Array.from({ length: ROWS }, (_, rowIndex) => (
        <capacitor
          key={`CROW${rowIndex + 1}`}
          name={`CROW${rowIndex + 1}`}
          capacitance="100nF"
          connections={{
            pin1: "net.V5",
            pin2: "net.GND",
          }}
        />
      ))}
    </board>,
  )

  await circuit.renderUntilSettled()

  const layoutErrors = circuit.db.schematic_layout_error.list()
  expect(layoutErrors).toHaveLength(0)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
}, 90_000)
