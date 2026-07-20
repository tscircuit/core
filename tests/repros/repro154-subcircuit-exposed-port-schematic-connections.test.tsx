import type { SubcircuitProps } from "@tscircuit/props"
import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const LowVoltagePowerSupply = (props: SubcircuitProps) => (
  <subcircuit {...props} exposeNets>
    <port name="VIN_P" direction="left" connectsTo={["U1.VIN_P"]} />
    <port name="PRI_GND" direction="left" connectsTo={["U1.PRI_GND"]} />
    <port name="VOUT_12V" direction="right" connectsTo={["U1.VOUT_12V"]} />
    <port name="VOUT_5V" direction="right" connectsTo={["U1.VOUT_5V"]} />
    <port name="VOUT_3V3" direction="right" connectsTo={["U1.VOUT_3V3"]} />
    <port name="VOUT_1V2" direction="right" connectsTo={["U1.VOUT_1V2"]} />
    <port name="SEC_GND" direction="right" connectsTo={["U1.SEC_GND"]} />

    <chip
      name="U1"
      footprint="soic8"
      pinLabels={{
        pin1: "VIN_P",
        pin2: "PRI_GND",
        pin3: "VOUT_12V",
        pin4: "VOUT_5V",
        pin5: "VOUT_3V3",
        pin6: "VOUT_1V2",
        pin7: "SEC_GND",
      }}
    />
  </subcircuit>
)

const Microcontroller = (props: SubcircuitProps) => (
  <subcircuit {...props} exposeNets>
    <port name="SWDIO" direction="left" connectsTo={["U1.SWDIO"]} />
    <port name="SWCLK" direction="left" connectsTo={["U1.SWCLK"]} />
    <port name="NRST" direction="left" connectsTo={["U1.NRST"]} />
    <port name="GND" direction="left" connectsTo={["U1.GND"]} />
    <port name="3V3" direction="left" connectsTo={["U1.3V3"]} />
    <port name="ADC_IN" direction="right" connectsTo={["U1.ADC_IN"]} />
    <port name="UART_TX" direction="right" connectsTo={["U1.UART_TX"]} />
    <port name="UART_RX" direction="right" connectsTo={["U1.UART_RX"]} />
    <port name="SPI_SCK" direction="right" connectsTo={["U1.SPI_SCK"]} />
    <port name="SPI_MISO" direction="right" connectsTo={["U1.SPI_MISO"]} />
    <port name="SPI_MOSI" direction="right" connectsTo={["U1.SPI_MOSI"]} />
    <port name="SYNC_GPIO" direction="right" connectsTo={["U1.SYNC_GPIO"]} />
    <port
      name="CONTACTOR_GPIO"
      direction="right"
      connectsTo={["U1.CONTACTOR_GPIO"]}
    />

    <chip
      name="U1"
      footprint="soic16"
      pinLabels={{
        pin1: "SWDIO",
        pin2: "SWCLK",
        pin3: "NRST",
        pin4: "GND",
        pin5: "3V3",
        pin6: "ADC_IN",
        pin7: "UART_TX",
        pin8: "UART_RX",
        pin9: "SPI_SCK",
        pin10: "SPI_MISO",
        pin11: "SPI_MOSI",
        pin12: "SYNC_GPIO",
        pin13: "CONTACTOR_GPIO",
      }}
    />
  </subcircuit>
)

test("boxed LVPS and MCU ports reproduce the missing ground schematic link", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <LowVoltagePowerSupply
        name="lvps"
        showAsSchematicBox
        schX={-4}
        schY={0}
      />
      <Microcontroller name="mcu" showAsSchematicBox schX={4} schY={0} />

      <trace name="t_v3v3_link" path={[".lvps > .VOUT_3V3", ".mcu > .3V3"]} />
      <trace name="t_gnd_link" path={[".lvps > .SEC_GND", ".mcu > .GND"]} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
