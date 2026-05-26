import { sel } from "tscircuit"

export const RP2040_SECTION = "rp2040"

const RP2040_X = -5.5
const RP2040_Y = 2.2

const RP2040_PIN_LABELS = {
  pin1: "IOVDD_1",
  pin2: "GPIO0",
  pin3: "GPIO1",
  pin4: "GPIO2",
  pin5: "GPIO3",
  pin6: "GPIO4",
  pin7: "GPIO5",
  pin8: "GPIO6",
  pin9: "GPIO7",
  pin10: "IOVDD_2",
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
  pin24: "SWCLK",
  pin25: "SWDIO",
  pin26: "RUN",
  pin27: "GPIO16",
  pin28: "GPIO17",
  pin29: "GPIO18",
  pin30: "GPIO19",
  pin31: "GPIO20",
  pin32: "GPIO21",
  pin33: "IOVDD_4",
  pin34: "GPIO22",
  pin35: "GPIO23",
  pin36: "GPIO24",
  pin37: "GPIO25",
  pin38: "GPIO26_ADC0",
  pin39: "GPIO27_ADC1",
  pin40: "GPIO28_ADC2",
  pin41: "GPIO29_ADC3",
  pin42: "IOVDD_5",
  pin43: "ADC_AVDD",
  pin44: "VREG_VIN",
  pin45: "VREG_VOUT",
  pin46: "USB_DM",
  pin47: "USB_DP",
  pin48: "USB_VDD",
  pin49: "IOVDD_6",
  pin50: "DVDD",
  pin51: "QSPI_SD3",
  pin52: "QSPI_SCLK",
  pin53: "QSPI_SD0",
  pin54: "QSPI_SD2",
  pin55: "QSPI_SD1",
  pin56: "QSPI_SS",
  pin57: "GND",
} as const

export const RP2040Circuit = () => (
  <>
    <chip
      schSectionName={RP2040_SECTION}
      schWidth="3.5"
      name="U3"
      schX={RP2040_X}
      schY={RP2040_Y}
      pinLabels={RP2040_PIN_LABELS}
      schPinArrangement={{
        topSide: {
          pins: [
            "IOVDD_5",
            "USB_VDD",
            "ADC_AVDD",
            "VREG_VIN",
            "VREG_VOUT",
            "DVDD",
          ],
          direction: "left-to-right",
        },
        bottomSide: {
          pins: ["TESTEN", "GND"],
          direction: "left-to-right",
        },
        leftSide: {
          pins: [
            "QSPI_SS",
            "QSPI_SD0",
            "QSPI_SD1",
            "QSPI_SD2",
            "QSPI_SD3",
            "QSPI_SCLK",
            "XIN",
            "XOUT",
            "RUN",
            "SWCLK",
            "SWDIO",
          ],
          direction: "top-to-bottom",
        },
        rightSide: {
          pins: [
            "USB_DP",
            "USB_DM",
            "GPIO0",
            "GPIO1",
            "GPIO2",
            "GPIO3",
            "GPIO4",
            "GPIO5",
            "GPIO6",
            "GPIO7",
            "GPIO8",
            "GPIO9",
            "GPIO10",
            "GPIO11",
            "GPIO12",
            "GPIO13",
            "GPIO14",
            "GPIO15",
            "GPIO16",
            "GPIO17",
            "GPIO18",
            "GPIO19",
            "GPIO20",
            "GPIO21",
            "GPIO22",
            "GPIO23",
            "GPIO24",
            "GPIO25",
            "GPIO26_ADC0",
            "GPIO27_ADC1",
            "GPIO28_ADC2",
            "GPIO29_ADC3",
          ],
          direction: "top-to-bottom",
        },
      }}
      schPinStyle={{
        GPIO26_ADC0: {
          marginTop: "0.2",
        },
        GND: {
          marginLeft: "0.5",
          marginRight: "0.5",
        },
        USB_DM: {
          marginBottom: "0.5",
        },
        ADC_AVDD: {
          marginRight: "0.5",
        },
        SWCLK: {
          marginTop: "1",
        },
        RUN: {
          marginTop: "1",
        },
        XOUT: {
          marginTop: "0.1",
        },
        XIN: {
          marginTop: "1",
        },
        QSPI_SS: {
          marginBottom: "0.08",
        },
        QSPI_SD3: {
          marginBottom: "0.08",
        },
        USB_DP: {
          marginBottom: "0.3",
        },

        VREG_VIN: {
          marginRight: "0.2",
        },
      }}
      connections={{
        pin42: sel.net.V3_3,
        pin48: sel.net.V3_3,
        pin43: sel.net.V3_3,
        pin44: sel.net.V3_3,
        pin45: "net.V1",
        pin50: "net.V1",
      }}
    />
    <resistor
      schSectionName={RP2040_SECTION}
      schX={RP2040_X + 3}
      schY={RP2040_Y + 3.6}
      name="R6"
      resistance="27R"
    />
    <resistor
      schSectionName={RP2040_SECTION}
      schX={RP2040_X + 4}
      schY={RP2040_Y + 3.1}
      name="R7"
      resistance="27R"
    />

    <resistor
      schSectionName={RP2040_SECTION}
      schX={RP2040_X - 4}
      schY={RP2040_Y - 1.23}
      name="R4"
      resistance="1k"
    />
    <resistor
      schSectionName={RP2040_SECTION}
      schX={RP2040_X - 4}
      schY={RP2040_Y - 2.63}
      name="R5"
      resistance="1k"
    />

    <resistor
      schSectionName={RP2040_SECTION}
      schX={RP2040_X + 4}
      schY={RP2040_Y - 0.8}
      name="R8"
      resistance="1k"
    />

    <trace from={sel.U3.pin47} to={sel.R6.pin1} />
    <trace from={sel.U3.pin46} to={sel.R7.pin1} />

    <trace from={sel.U3.pin27} to={sel.R8.pin1} />
    <trace from={sel.U3.pin28} to={sel.R8.pin2} />

    <trace from={sel.U3.pin25} to={sel.R5.pin2} />
    <trace from={sel.U3.pin26} to={sel.R4.pin2} />

    <trace from={sel.R4.pin1} to={sel.net.V3_3} />
    <trace from={sel.R5.pin1} to={sel.net.V3_3} />

    <trace from={sel.U3.pin19} to={sel.net.GND} />
    <trace from={sel.U3.pin57} to={sel.net.GND} />
  </>
)

export default () => (
  <board schAutoLayoutEnabled>
    <RP2040Circuit />
  </board>
)
