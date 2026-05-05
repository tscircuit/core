import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("RP2040", () => {
  const { circuit } = getTestFixture()

  const rp2040PinLabels = {
    pin1: "IOVDD",
    pin2: "GPIO0",
    pin3: "GPIO1",
    pin4: "GPIO2",
    pin5: "GPIO3",
    pin6: "GPIO4",
    pin7: "GPIO5",
    pin8: "GPIO6",
    pin9: "GPIO7",
    pin10: "IOVDD",
    pin11: "GPIO8",
    pin12: "GPIO9",
    pin13: "GPIO10",
    pin14: "GPIO11",
    pin15: "GPIO12",
    pin16: "GPIO13",
    pin17: "GPIO14",
    pin18: "GPIO15",
    pin19: "TESTEN",
    pin20: "XIN",
    pin21: "XOUT",
    pin22: "IOVDD",
    pin23: "DVDD",
    pin24: "SWCLK",
    pin25: "SWDIO",
    pin26: "RUN",
    pin27: "GPIO16",
    pin28: "GPIO17",
    pin29: "GPIO18",
    pin30: "GPIO19",
    pin31: "GPIO20",
    pin32: "GPIO21",
    pin33: "GPIO22",
    pin34: "GPIO23",
    pin35: "GPIO24",
    pin36: "GPIO25",
    pin37: "GPIO26_ADC0",
    pin38: "GPIO27_ADC1",
    pin39: "GPIO28_ADC2",
    pin40: "GPIO29_ADC3",
    pin41: "ADC_AVDD",
    pin42: "VREG_VIN",
    pin43: "VREG_VOUT",
    pin44: "USB_VDD",
    pin45: "GND",
    pin46: "USB_DM",
    pin47: "USB_DP",
    pin48: "QSPI_SD3",
    pin49: "QSPI_SCLK",
    pin50: "QSPI_SD0",
    pin51: "QSPI_SD2",
    pin52: "QSPI_SD1",
    pin53: "QSPI_SS",
    pin54: "GND",
    pin55: "DVDD",
    pin56: "IOVDD",
  } as const

  const leftHeaderPins = [
    "D_PLUS",
    "D_MINUS",
    "D0",
    "GND",
    "D1",
    "D2",
    "D3",
    "D4",
    "D5",
    "D6",
    "D7",
    "D8",
    "D9",
  ] as const

  const rightHeaderPins = [
    "D_MINUS",
    "RAW",
    "GND",
    "RESET",
    "V3V3",
    "A3",
    "A2",
    "A1",
    "A0",
    "SCLK",
    "MISO",
    "MOSI",
    "D10",
  ] as const

  circuit.add(
    <board width="90mm" height="60mm" routingDisabled>
      <schematicsection name="mcu" displayName="RP2040 MCU" />
      <schematicsection name="pwr" displayName="Power Supply" />
      <schematicsection name="clk" displayName="Clock / Crystal" />
      <schematicsection name="boot" displayName="Boot / Reset" />
      <schematicsection name="usb" displayName="USB-C Interface" />
      <schematicsection name="i2c" displayName="STEMMA I2C" />
      <schematicsection name="qspi" displayName="QSPI Flash" />
      <schematicsection name="neo" displayName="NeoPixel" />
      <schematicsection name="hdr" displayName="Board Headers" />

      {/* Row 1, Col 1: MCU */}
      <chip
        name="IC2"
        manufacturerPartNumber="RP2040"
        footprint="pinrow56"
        schX={-12}
        schY={8}
        schWidth={2.815}
        schHeight={9.88}
        schSectionName="mcu"
        pinLabels={rp2040PinLabels}
        schPinArrangement={{
          leftSide: {
            pins: [
              "pin26",
              "pin1",
              "pin22",
              "pin41",
              "pin23",
              "pin43",
              "pin19",
              "pin20",
              "pin21",
              "pin36",
              "pin37",
              "pin38",
              "pin39",
              "pin40",
              "pin49",
              "pin53",
              "pin50",
              "pin52",
              "pin51",
              "pin48",
              "pin45",
              "pin46",
              "pin47",
              "pin24",
              "pin25",
            ],
            direction: "top-to-bottom",
          },
          rightSide: {
            pins: [
              "pin2",
              "pin3",
              "pin4",
              "pin5",
              "pin6",
              "pin7",
              "pin8",
              "pin9",
              "pin11",
              "pin12",
              "pin13",
              "pin14",
              "pin15",
              "pin16",
              "pin17",
              "pin18",
              "pin27",
              "pin28",
              "pin29",
              "pin30",
              "pin31",
              "pin32",
              "pin33",
              "pin34",
              "pin35",
            ],
            direction: "top-to-bottom",
          },
        }}
        connections={{
          IOVDD: "net.V3V3",
          GPIO0: "net.D0",
          GPIO1: "net.D1",
          GPIO2: "net.D2",
          GPIO3: "net.D3",
          GPIO4: "net.D4",
          GPIO5: "net.D5",
          GPIO6: "net.D6",
          GPIO7: "net.D7",
          GPIO8: "net.D8",
          GPIO9: "net.D9",
          GPIO10: "net.D10",
          GPIO11: "net.USBOOT",
          GPIO12: "net.SDA",
          GPIO13: "net.SCL",
          GPIO16: "net.NEOPIX",
          GPIO18: "net.SCLK",
          GPIO20: "net.MOSI",
          GPIO19: "net.MISO",
          GPIO26_ADC0: "net.A0",
          GPIO27_ADC1: "net.A1",
          GPIO28_ADC2: "net.A2",
          GPIO29_ADC3: "net.A3",
          RUN: "net.RESET",
          USB_DM: "net.D_MINUS",
          USB_DP: "net.D_PLUS",
          QSPI_SCLK: "net.QSPI_SCK",
          QSPI_SS: "net.QSPI_CS",
          QSPI_SD0: "net.QSPI_DATA0",
          QSPI_SD1: "net.QSPI_DATA1",
          QSPI_SD2: "net.QSPI_DATA2",
          QSPI_SD3: "net.QSPI_DATA3",
          VREG_VIN: "net.V3V3",
          USB_VDD: "net.V3V3",
          DVDD: "net.V1V2",
          ADC_AVDD: "net.V3V3",
          GND: "net.GND",
          TESTEN: "net.GND",
          XIN: "net.XIN",
          XOUT: "net.XOUT",
          SWCLK: "net.SWCLK",
          SWDIO: "net.SWDIO",
        }}
      />

      {/* Row 1, Col 2: Clock */}
      <crystal
        name="Y1"
        frequency="12MHz"
        loadCapacitance="10pF"
        footprint="pinrow2"
        schX={0}
        schY={8}
        schOrientation="vertical"
        schSectionName="clk"
        connections={{ left: "net.XIN", right: "net.XOUT" }}
      />
      <capacitor
        name="C19"
        capacitance="22pF"
        footprint="0402"
        schX={-1.2}
        schY={6.7}
        schOrientation="vertical"
        schSectionName="clk"
        connections={{ pin1: "net.XIN", pin2: "net.GND" }}
      />
      <capacitor
        name="C20"
        capacitance="22pF"
        footprint="0402"
        schX={1.2}
        schY={6.7}
        schOrientation="vertical"
        schSectionName="clk"
        connections={{ pin1: "net.XOUT", pin2: "net.GND" }}
      />

      {/* Row 1, Col 3: Boot / Reset */}
      <resistor
        name="R3"
        resistance="10k"
        footprint="0402"
        schX={11}
        schY={8.7}
        schRotation={90}
        schSectionName="boot"
        connections={{ pin1: "net.V3V3", pin2: "net.RESET" }}
      />
      <netlabel net="RESET" connectsTo=".IC2 > .RUN" />
      <resistor
        name="R2"
        resistance="10k"
        footprint="0402"
        schX={9.4}
        schY={6.8}
        schSectionName="boot"
        connections={{ pin1: "net.V3V3", pin2: "net.USBOOT" }}
      />
      <pushbutton
        name="SW3"
        footprint="pinrow2"
        pinLabels={{ pin1: "A", pin2: "B" }}
        schX={9.4}
        schY={5.4}
        schWidth={2}
        schHeight={1.2}
        schSectionName="boot"
        connections={{ A: "net.USBOOT", B: "net.GND" }}
      />
      <pushbutton
        name="SW2"
        footprint="pinrow2"
        pinLabels={{ pin1: "A", pin2: "B" }}
        schX={12.5}
        schY={5.4}
        schWidth={2}
        schHeight={1.2}
        schSectionName="boot"
        connections={{ A: "net.RESET", B: "net.GND" }}
      />

      {/* Row 2, Col 1: Power */}
      <diode
        name="DPROT"
        displayName="D1"
        variant="schottky"
        footprint="0603"
        schX={-15.2}
        schY={-1.2}
        schSectionName="pwr"
        connections={{ anode: "net.VBUS", cathode: "net.RAW" }}
      />
      <fuse
        name="F1"
        currentRating="500mA"
        footprint="0603"
        schX={-15.2}
        schY={0.1}
        schSectionName="pwr"
        connections={{ pin1: "net.VBUS", pin2: ".DPROT > .anode" }}
      />
      <chip
        name="U2"
        manufacturerPartNumber="AP2112K-3.3"
        footprint="soic5"
        schX={-11.8}
        schY={-0.6}
        schWidth={1.77}
        schHeight={0.6}
        schSectionName="pwr"
        pinLabels={{
          pin1: "IN",
          pin2: "GND",
          pin3: "EN",
          pin4: "NC",
          pin5: "OUT",
        }}
        schPinArrangement={{
          leftSide: ["pin1", "pin2", "pin3"],
          rightSide: ["pin5", "pin4"],
        }}
        connections={{
          IN: "net.RAW",
          EN: "net.RAW",
          OUT: "net.V3V3",
          GND: "net.GND",
        }}
        noConnect={["NC"]}
      />
      <capacitor
        name="C1"
        capacitance="10uF"
        footprint="0603"
        schX={-14.2}
        schY={-2.7}
        schOrientation="vertical"
        schSectionName="pwr"
        connections={{ pin1: "net.RAW", pin2: "net.GND" }}
      />
      <capacitor
        name="C4"
        capacitance="10uF"
        footprint="0603"
        schX={-9.4}
        schY={-2.7}
        schOrientation="vertical"
        schSectionName="pwr"
        connections={{ pin1: "net.V3V3", pin2: "net.GND" }}
      />
      <led
        name="DPWR"
        displayName="D2"
        color="green"
        footprint="0603"
        schX={-8.1}
        schY={0.1}
        schSectionName="pwr"
        connections={{ anode: "net.V3V3", cathode: "net.PWR_LED_K" }}
      />
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        schX={-8.1}
        schY={-1.4}
        schSectionName="pwr"
        connections={{ pin1: "net.PWR_LED_K", pin2: "net.GND" }}
      />
      <capacitor
        name="C18"
        capacitance="1uF"
        footprint="0402"
        schX={-4.8}
        schY={-1.4}
        schOrientation="vertical"
        schSectionName="pwr"
        connections={{ pin1: "net.V3V3", pin2: "net.GND" }}
      />

      {/* Row 2, Col 2: USB */}
      <connector
        name="U3"
        standard="usb_c"
        footprint="pinrow8"
        schX={0}
        schY={0}
        schWidth={4.4}
        schHeight={2.0}
        schSectionName="usb"
        pinLabels={{
          pin1: "VBUS",
          pin2: "D_PLUS",
          pin3: "D_MINUS",
          pin4: "CC1",
          pin5: "CC2",
          pin6: "SBU1",
          pin7: "SBU2",
          pin8: "GND",
        }}
        schPinArrangement={{
          rightSide: [
            "pin1",
            "pin2",
            "pin3",
            "pin4",
            "pin5",
            "pin6",
            "pin7",
            "pin8",
          ],
        }}
        connections={{
          VBUS: "net.VBUS",
          D_PLUS: "net.D_PLUS",
          D_MINUS: "net.D_MINUS",
          CC1: "net.CC1",
          CC2: "net.CC2",
          GND: "net.GND",
        }}
        noConnect={["SBU1", "SBU2"]}
      />
      <resistor
        name="R8"
        resistance="5.1k"
        footprint="0402"
        schX={3.2}
        schY={-1.4}
        schSectionName="usb"
        connections={{ pin1: "net.CC1", pin2: "net.GND" }}
      />
      <resistor
        name="R9"
        resistance="5.1k"
        footprint="0402"
        schX={3.2}
        schY={-2.4}
        schSectionName="usb"
        connections={{ pin1: "net.CC2", pin2: "net.GND" }}
      />
      <netlabel net="VBUS" connectsTo=".U3 > .VBUS" />

      {/* Row 2, Col 3: STEMMA I2C */}
      <pinheader
        name="CONN1"
        pinCount={4}
        gender="female"
        footprint="pinrow4"
        pinLabels={["GND", "V_PLUS", "SDA", "SCL"]}
        schX={11.8}
        schY={0.2}
        schWidth={0.77}
        schFacingDirection="left"
        schSectionName="i2c"
        connections={{
          GND: "net.GND",
          V_PLUS: "net.V3V3",
          SDA: "net.SDA",
          SCL: "net.SCL",
        }}
      />
      <schematictext
        schX={11.8}
        schY={-1.5}
        text="STEMMA_I2C_QTSKINNY"
        color="#888888"
        fontSize={0.35}
      />
      <resistor
        name="R10"
        resistance="10k"
        footprint="0402"
        schX={9.6}
        schY={0.7}
        schSectionName="i2c"
        connections={{ pin1: "net.V3V3", pin2: "net.SDA" }}
      />
      <resistor
        name="R11"
        resistance="5.1k"
        footprint="0402"
        schX={9.6}
        schY={-0.3}
        schSectionName="i2c"
        connections={{ pin1: "net.V3V3", pin2: "net.SCL" }}
      />

      {/* Row 3, Col 1: Headers */}
      <netlabel net="A0" connectsTo=".IC2 > .GPIO26_ADC0" />
      <netlabel net="A1" connectsTo=".IC2 > .GPIO27_ADC1" />
      <netlabel net="A2" connectsTo=".IC2 > .GPIO28_ADC2" />
      <netlabel net="A3" connectsTo=".IC2 > .GPIO29_ADC3" />
      <pinheader
        name="JP2"
        pinCount={13}
        gender="female"
        footprint="pinrow13"
        pinLabels={[...leftHeaderPins]}
        schX={-12.8}
        schY={-9}
        schWidth={0.865}
        schFacingDirection="right"
        schSectionName="hdr"
        connections={Object.fromEntries(
          leftHeaderPins.map((pin) => [pin, `net.${pin}`]),
        )}
      />
      <pinheader
        name="JP1"
        pinCount={13}
        gender="female"
        footprint="pinrow13"
        pinLabels={[...rightHeaderPins]}
        schX={-8.6}
        schY={-9}
        schWidth={0.865}
        schFacingDirection="left"
        schSectionName="hdr"
        connections={Object.fromEntries(
          rightHeaderPins.map((pin) => [
            pin,
            pin === "RAW" ? "net.RAW" : `net.${pin}`,
          ]),
        )}
      />

      {/* Row 3, Col 2: QSPI */}
      <resistor
        name="R7"
        resistance="1k"
        footprint="0402"
        schX={-1.4}
        schY={-6.6}
        schSectionName="qspi"
        connections={{ pin1: "net.V3V3", pin2: "net.QSPI_CS" }}
      />
      <chip
        name="U5"
        manufacturerPartNumber="8MB QSPI Flash"
        footprint="soic8"
        schX={0}
        schY={-8.4}
        schWidth={2.245}
        schHeight={1.0}
        schSectionName="qspi"
        pinLabels={{
          pin1: "SCK",
          pin2: "MOSI",
          pin3: "MISO",
          pin4: "SSEL",
          pin5: "WP_IO2",
          pin6: "HOLD_IO3",
          pin7: "VSS",
          pin8: "VCC",
        }}
        schPinArrangement={{
          leftSide: ["pin1", "pin2", "pin3", "pin4"],
          rightSide: ["pin5", "pin6", "pin8", "pin7"],
        }}
        connections={{
          SCK: "net.QSPI_SCK",
          MOSI: "net.QSPI_DATA0",
          MISO: "net.QSPI_DATA1",
          SSEL: "net.QSPI_CS",
          WP_IO2: "net.QSPI_DATA2",
          HOLD_IO3: "net.QSPI_DATA3",
          VSS: "net.GND",
          VCC: "net.V3V3",
        }}
      />
      <netlabel net="QSPI_SCK" connectsTo=".U5 > .SCK" />
      <netlabel net="QSPI_DATA0" connectsTo=".U5 > .MOSI" />
      <netlabel net="QSPI_DATA1" connectsTo=".U5 > .MISO" />
      <netlabel net="QSPI_CS" connectsTo=".U5 > .SSEL" />
      <netlabel net="QSPI_DATA2" connectsTo=".U5 > .WP_IO2" />
      <netlabel net="QSPI_DATA3" connectsTo=".U5 > .HOLD_IO3" />

      {/* Row 3, Col 3: NeoPixel */}
      <chip
        name="NEO1"
        displayName="D3"
        manufacturerPartNumber="WS2812B"
        footprint="soic4"
        schX={11.2}
        schY={-8.4}
        schWidth={1.4}
        schHeight={1.3}
        schSectionName="neo"
        pinLabels={{ pin1: "VDD", pin2: "DIN", pin3: "DOUT", pin4: "GND" }}
        schPinArrangement={{
          leftSide: ["pin2"],
          rightSide: ["pin3"],
          topSide: ["pin1"],
          bottomSide: ["pin4"],
        }}
        connections={{ VDD: "net.V3V3", DIN: "net.NEOPIX", GND: "net.GND" }}
        noConnect={["DOUT"]}
      />
      <netlabel net="NEOPIX" connectsTo=".NEO1 > .DIN" />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
