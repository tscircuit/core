import { expect, test } from "bun:test"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test.failing(
  "Gameboy-like board routes directly to a dense MCU subcircuit without headers",
  async () => {
    const { circuit } = getTestFixture()
    const autoroutingPhaseIoStack = createAutoroutingPhaseIoStack(circuit)

    circuit.add(
      <board
        outline={[
          { x: -45, y: 22 },
          { x: -42, y: 27 },
          { x: 42, y: 27 },
          { x: 45, y: 22 },
          { x: 43, y: -24 },
          { x: 30, y: -27 },
          { x: -30, y: -27 },
          { x: -43, y: -24 },
        ]}
        layers={2}
        minTraceWidth="0.1mm"
        defaultTraceWidth="0.1mm"
        minTraceToPadEdgeClearance="0.1mm"
        minViaEdgeToPadEdgeClearance="0.1mm"
        minViaHoleDiameter="0.2mm"
        minViaPadDiameter="0.45mm"
      >
        <subcircuit name="MCU">
          <net name="V3V3" />
          <net name="V1V1" />
          <net name="GND" />

          <chip
            name="U1"
            pinLabels={{
              pin1: "IOVDD6",
              pin2: "GPIO0",
              pin3: "GPIO1",
              pin4: "GPIO2",
              pin5: "GPIO3",
              pin6: "DVDD3",
              pin7: "GPIO4",
              pin8: "GPIO5",
              pin9: "GPIO6",
              pin10: "GPIO7",
              pin11: "IOVDD5",
              pin12: "GPIO8",
              pin13: "GPIO9",
              pin14: "GPIO10",
              pin15: "GPIO11",
              pin16: "GPIO12",
              pin17: "GPIO13",
              pin18: "GPIO14",
              pin19: "GPIO15",
              pin20: "IOVDD4",
              pin21: "XIN",
              pin22: "XOUT",
              pin23: "DVDD2",
              pin24: "SWCLK",
              pin25: "SWDIO",
              pin26: "RUN",
              pin27: "GPIO16",
              pin28: "GPIO17",
              pin29: "GPIO18",
              pin30: "IOVDD3",
              pin31: "GPIO19",
              pin32: "GPIO20",
              pin33: "GPIO21",
              pin34: "GPIO22",
              pin35: "GPIO23",
              pin36: "GPIO24",
              pin37: "GPIO25",
              pin38: "IOVDD2",
              pin39: "DVDD1",
              pin40: "GPIO26_ADC0",
              pin41: "GPIO27_ADC1",
              pin42: "GPIO28_ADC2",
              pin43: "GPIO29_ADC3",
              pin44: "ADC_AVDD",
              pin45: "IOVDD1",
              pin46: "VREG_AVDD",
              pin47: "VREG_PGND",
              pin48: "VREG_LX",
              pin49: "VREG_VIN",
              pin50: "VREG_FB",
              pin51: "USB_DM",
              pin52: "USB_DP",
              pin53: "USB_OTP_VDD",
              pin54: "QSPI_IOVDD",
              pin55: "QSPI_SD3",
              pin56: "QSPI_SCLK",
              pin57: "QSPI_SD0",
              pin58: "QSPI_SD2",
              pin59: "QSPI_SD1",
              pin60: "QSPI_SS",
              pin61: "GND",
            }}
            pcbX={0}
            pcbY={0}
            footprint={
              <footprint>
                <smtpad
                  portHints={["pin1"]}
                  shape="rect"
                  pcbX={-3.575}
                  pcbY={2.8}
                  width={0.875}
                  height={0.2}
                />
                <smtpad
                  portHints={["pin2"]}
                  shape="rect"
                  pcbX={-3.575}
                  pcbY={2.4}
                  width={0.875}
                  height={0.2}
                />
                <smtpad
                  portHints={["pin3"]}
                  shape="rect"
                  pcbX={-3.575}
                  pcbY={1.9999999999999998}
                  width={0.875}
                  height={0.2}
                />
                <smtpad
                  portHints={["pin4"]}
                  shape="rect"
                  pcbX={-3.575}
                  pcbY={1.5999999999999996}
                  width={0.875}
                  height={0.2}
                />
                <smtpad
                  portHints={["pin5"]}
                  shape="rect"
                  pcbX={-3.575}
                  pcbY={1.1999999999999997}
                  width={0.875}
                  height={0.2}
                />
                <smtpad
                  portHints={["pin6"]}
                  shape="rect"
                  pcbX={-3.575}
                  pcbY={0.7999999999999998}
                  width={0.875}
                  height={0.2}
                />
                <smtpad
                  portHints={["pin7"]}
                  shape="rect"
                  pcbX={-3.575}
                  pcbY={0.39999999999999947}
                  width={0.875}
                  height={0.2}
                />
                <smtpad
                  portHints={["pin8"]}
                  shape="rect"
                  pcbX={-3.575}
                  pcbY={-4.440892098500626e-16}
                  width={0.875}
                  height={0.2}
                />
                <smtpad
                  portHints={["pin9"]}
                  shape="rect"
                  pcbX={-3.575}
                  pcbY={-0.40000000000000036}
                  width={0.875}
                  height={0.2}
                />
                <smtpad
                  portHints={["pin10"]}
                  shape="rect"
                  pcbX={-3.575}
                  pcbY={-0.8000000000000003}
                  width={0.875}
                  height={0.2}
                />
                <smtpad
                  portHints={["pin11"]}
                  shape="rect"
                  pcbX={-3.575}
                  pcbY={-1.2000000000000002}
                  width={0.875}
                  height={0.2}
                />
                <smtpad
                  portHints={["pin12"]}
                  shape="rect"
                  pcbX={-3.575}
                  pcbY={-1.6000000000000005}
                  width={0.875}
                  height={0.2}
                />
                <smtpad
                  portHints={["pin13"]}
                  shape="rect"
                  pcbX={-3.575}
                  pcbY={-2.000000000000001}
                  width={0.875}
                  height={0.2}
                />
                <smtpad
                  portHints={["pin14"]}
                  shape="rect"
                  pcbX={-3.575}
                  pcbY={-2.4000000000000004}
                  width={0.875}
                  height={0.2}
                />
                <smtpad
                  portHints={["pin15"]}
                  shape="rect"
                  pcbX={-3.575}
                  pcbY={-2.8000000000000007}
                  width={0.875}
                  height={0.2}
                />
                <smtpad
                  portHints={["pin16"]}
                  shape="rect"
                  pcbX={-2.8}
                  pcbY={-3.575}
                  width={0.2}
                  height={0.875}
                />
                <smtpad
                  portHints={["pin17"]}
                  shape="rect"
                  pcbX={-2.4}
                  pcbY={-3.575}
                  width={0.2}
                  height={0.875}
                />
                <smtpad
                  portHints={["pin18"]}
                  shape="rect"
                  pcbX={-1.9999999999999998}
                  pcbY={-3.575}
                  width={0.2}
                  height={0.875}
                />
                <smtpad
                  portHints={["pin19"]}
                  shape="rect"
                  pcbX={-1.5999999999999996}
                  pcbY={-3.575}
                  width={0.2}
                  height={0.875}
                />
                <smtpad
                  portHints={["pin20"]}
                  shape="rect"
                  pcbX={-1.1999999999999997}
                  pcbY={-3.575}
                  width={0.2}
                  height={0.875}
                />
                <smtpad
                  portHints={["pin21"]}
                  shape="rect"
                  pcbX={-0.7999999999999998}
                  pcbY={-3.575}
                  width={0.2}
                  height={0.875}
                />
                <smtpad
                  portHints={["pin22"]}
                  shape="rect"
                  pcbX={-0.39999999999999947}
                  pcbY={-3.575}
                  width={0.2}
                  height={0.875}
                />
                <smtpad
                  portHints={["pin23"]}
                  shape="rect"
                  pcbX={4.440892098500626e-16}
                  pcbY={-3.575}
                  width={0.2}
                  height={0.875}
                />
                <smtpad
                  portHints={["pin24"]}
                  shape="rect"
                  pcbX={0.40000000000000036}
                  pcbY={-3.575}
                  width={0.2}
                  height={0.875}
                />
                <smtpad
                  portHints={["pin25"]}
                  shape="rect"
                  pcbX={0.8000000000000003}
                  pcbY={-3.575}
                  width={0.2}
                  height={0.875}
                />
                <smtpad
                  portHints={["pin26"]}
                  shape="rect"
                  pcbX={1.2000000000000002}
                  pcbY={-3.575}
                  width={0.2}
                  height={0.875}
                />
                <smtpad
                  portHints={["pin27"]}
                  shape="rect"
                  pcbX={1.6000000000000005}
                  pcbY={-3.575}
                  width={0.2}
                  height={0.875}
                />
                <smtpad
                  portHints={["pin28"]}
                  shape="rect"
                  pcbX={2.000000000000001}
                  pcbY={-3.575}
                  width={0.2}
                  height={0.875}
                />
                <smtpad
                  portHints={["pin29"]}
                  shape="rect"
                  pcbX={2.4000000000000004}
                  pcbY={-3.575}
                  width={0.2}
                  height={0.875}
                />
                <smtpad
                  portHints={["pin30"]}
                  shape="rect"
                  pcbX={2.8000000000000007}
                  pcbY={-3.575}
                  width={0.2}
                  height={0.875}
                />
                <smtpad
                  portHints={["pin31"]}
                  shape="rect"
                  pcbX={3.575}
                  pcbY={-2.8}
                  width={0.875}
                  height={0.2}
                />
                <smtpad
                  portHints={["pin32"]}
                  shape="rect"
                  pcbX={3.575}
                  pcbY={-2.4}
                  width={0.875}
                  height={0.2}
                />
                <smtpad
                  portHints={["pin33"]}
                  shape="rect"
                  pcbX={3.575}
                  pcbY={-1.9999999999999998}
                  width={0.875}
                  height={0.2}
                />
                <smtpad
                  portHints={["pin34"]}
                  shape="rect"
                  pcbX={3.575}
                  pcbY={-1.5999999999999996}
                  width={0.875}
                  height={0.2}
                />
                <smtpad
                  portHints={["pin35"]}
                  shape="rect"
                  pcbX={3.575}
                  pcbY={-1.1999999999999997}
                  width={0.875}
                  height={0.2}
                />
                <smtpad
                  portHints={["pin36"]}
                  shape="rect"
                  pcbX={3.575}
                  pcbY={-0.7999999999999998}
                  width={0.875}
                  height={0.2}
                />
                <smtpad
                  portHints={["pin37"]}
                  shape="rect"
                  pcbX={3.575}
                  pcbY={-0.39999999999999947}
                  width={0.875}
                  height={0.2}
                />
                <smtpad
                  portHints={["pin38"]}
                  shape="rect"
                  pcbX={3.575}
                  pcbY={4.440892098500626e-16}
                  width={0.875}
                  height={0.2}
                />
                <smtpad
                  portHints={["pin39"]}
                  shape="rect"
                  pcbX={3.575}
                  pcbY={0.40000000000000036}
                  width={0.875}
                  height={0.2}
                />
                <smtpad
                  portHints={["pin40"]}
                  shape="rect"
                  pcbX={3.575}
                  pcbY={0.8000000000000003}
                  width={0.875}
                  height={0.2}
                />
                <smtpad
                  portHints={["pin41"]}
                  shape="rect"
                  pcbX={3.575}
                  pcbY={1.2000000000000002}
                  width={0.875}
                  height={0.2}
                />
                <smtpad
                  portHints={["pin42"]}
                  shape="rect"
                  pcbX={3.575}
                  pcbY={1.6000000000000005}
                  width={0.875}
                  height={0.2}
                />
                <smtpad
                  portHints={["pin43"]}
                  shape="rect"
                  pcbX={3.575}
                  pcbY={2.000000000000001}
                  width={0.875}
                  height={0.2}
                />
                <smtpad
                  portHints={["pin44"]}
                  shape="rect"
                  pcbX={3.575}
                  pcbY={2.4000000000000004}
                  width={0.875}
                  height={0.2}
                />
                <smtpad
                  portHints={["pin45"]}
                  shape="rect"
                  pcbX={3.575}
                  pcbY={2.8000000000000007}
                  width={0.875}
                  height={0.2}
                />
                <smtpad
                  portHints={["pin46"]}
                  shape="rect"
                  pcbX={2.8}
                  pcbY={3.575}
                  width={0.2}
                  height={0.875}
                />
                <smtpad
                  portHints={["pin47"]}
                  shape="rect"
                  pcbX={2.4}
                  pcbY={3.575}
                  width={0.2}
                  height={0.875}
                />
                <smtpad
                  portHints={["pin48"]}
                  shape="rect"
                  pcbX={1.9999999999999998}
                  pcbY={3.575}
                  width={0.2}
                  height={0.875}
                />
                <smtpad
                  portHints={["pin49"]}
                  shape="rect"
                  pcbX={1.5999999999999996}
                  pcbY={3.575}
                  width={0.2}
                  height={0.875}
                />
                <smtpad
                  portHints={["pin50"]}
                  shape="rect"
                  pcbX={1.1999999999999997}
                  pcbY={3.575}
                  width={0.2}
                  height={0.875}
                />
                <smtpad
                  portHints={["pin51"]}
                  shape="rect"
                  pcbX={0.7999999999999998}
                  pcbY={3.575}
                  width={0.2}
                  height={0.875}
                />
                <smtpad
                  portHints={["pin52"]}
                  shape="rect"
                  pcbX={0.39999999999999947}
                  pcbY={3.575}
                  width={0.2}
                  height={0.875}
                />
                <smtpad
                  portHints={["pin53"]}
                  shape="rect"
                  pcbX={-4.440892098500626e-16}
                  pcbY={3.575}
                  width={0.2}
                  height={0.875}
                />
                <smtpad
                  portHints={["pin54"]}
                  shape="rect"
                  pcbX={-0.40000000000000036}
                  pcbY={3.575}
                  width={0.2}
                  height={0.875}
                />
                <smtpad
                  portHints={["pin55"]}
                  shape="rect"
                  pcbX={-0.8000000000000003}
                  pcbY={3.575}
                  width={0.2}
                  height={0.875}
                />
                <smtpad
                  portHints={["pin56"]}
                  shape="rect"
                  pcbX={-1.2000000000000002}
                  pcbY={3.575}
                  width={0.2}
                  height={0.875}
                />
                <smtpad
                  portHints={["pin57"]}
                  shape="rect"
                  pcbX={-1.6000000000000005}
                  pcbY={3.575}
                  width={0.2}
                  height={0.875}
                />
                <smtpad
                  portHints={["pin58"]}
                  shape="rect"
                  pcbX={-2.000000000000001}
                  pcbY={3.575}
                  width={0.2}
                  height={0.875}
                />
                <smtpad
                  portHints={["pin59"]}
                  shape="rect"
                  pcbX={-2.4000000000000004}
                  pcbY={3.575}
                  width={0.2}
                  height={0.875}
                />
                <smtpad
                  portHints={["pin60"]}
                  shape="rect"
                  pcbX={-2.8000000000000007}
                  pcbY={3.575}
                  width={0.2}
                  height={0.875}
                />
                <smtpad
                  portHints={["pin61"]}
                  shape="rect"
                  width="3.4mm"
                  height="3.4mm"
                />
              </footprint>
            }
          />

          <chip
            name="U_FLASH"
            footprint="soic8"
            pinLabels={{
              pin1: "CS",
              pin2: "SD1",
              pin3: "SD2",
              pin4: "GND",
              pin5: "SD0",
              pin6: "SCLK",
              pin7: "SD3",
              pin8: "VCC",
            }}
            pcbX={10}
            pcbY={3}
          />
          <chip
            name="U_USB"
            footprint="soic8"
            pinLabels={{
              pin1: "DM",
              pin2: "DP",
              pin3: "VBUS",
              pin4: "GND",
              pin5: "CC1",
              pin6: "CC2",
              pin7: "SH1",
              pin8: "SH2",
            }}
            pcbX={0}
            pcbY={-17}
          />
          <capacitor
            name="C1"
            capacitance="100nF"
            footprint="0402"
            pcbX={-7}
            pcbY={5}
          />
          <capacitor
            name="C2"
            capacitance="100nF"
            footprint="0402"
            pcbX={-7}
            pcbY={1.7}
          />
          <capacitor
            name="C3"
            capacitance="100nF"
            footprint="0402"
            pcbX={-7}
            pcbY={-1.7}
          />
          <capacitor
            name="C4"
            capacitance="100nF"
            footprint="0402"
            pcbX={-7}
            pcbY={-5}
          />
          <resistor
            name="R_USB_DM"
            resistance="27"
            footprint="0402"
            pcbX={-2}
            pcbY={-10}
          />
          <resistor
            name="R_USB_DP"
            resistance="27"
            footprint="0402"
            pcbX={2}
            pcbY={-10}
          />

          <trace from=".U1 > .QSPI_SS" to=".U_FLASH > .CS" />
          <trace from=".U1 > .QSPI_SD0" to=".U_FLASH > .SD0" />
          <trace from=".U1 > .QSPI_SD1" to=".U_FLASH > .SD1" />
          <trace from=".U1 > .QSPI_SD2" to=".U_FLASH > .SD2" />
          <trace from=".U1 > .QSPI_SD3" to=".U_FLASH > .SD3" />
          <trace from=".U1 > .QSPI_SCLK" to=".U_FLASH > .SCLK" />
          <trace from=".U_FLASH > .VCC" to="net.V3V3" />
          <trace from=".U_FLASH > .GND" to="net.GND" />

          <trace name="IOVDD1_V3V3" from=".U1 > .IOVDD1" to="net.V3V3" />
          <trace name="IOVDD2_V3V3" from=".U1 > .IOVDD2" to="net.V3V3" />
          <trace name="IOVDD3_V3V3" from=".U1 > .IOVDD3" to="net.V3V3" />
          <trace name="IOVDD4_V3V3" from=".U1 > .IOVDD4" to="net.V3V3" />
          <trace name="IOVDD5_V3V3" from=".U1 > .IOVDD5" to="net.V3V3" />
          <trace name="IOVDD6_V3V3" from=".U1 > .IOVDD6" to="net.V3V3" />
          <trace name="ADC_AVDD_V3V3" from=".U1 > .ADC_AVDD" to="net.V3V3" />
          <trace name="VREG_VIN_V3V3" from=".U1 > .VREG_VIN" to="net.V3V3" />
          <trace name="VREG_AVDD_V3V3" from=".U1 > .VREG_AVDD" to="net.V3V3" />
          <trace
            name="USB_OTP_VDD_V3V3"
            from=".U1 > .USB_OTP_VDD"
            to="net.V3V3"
          />
          <trace
            name="QSPI_IOVDD_V3V3"
            from=".U1 > .QSPI_IOVDD"
            to="net.V3V3"
          />
          <trace name="DVDD1_V1V1" from=".U1 > .DVDD1" to="net.V1V1" />
          <trace name="DVDD2_V1V1" from=".U1 > .DVDD2" to="net.V1V1" />
          <trace name="DVDD3_V1V1" from=".U1 > .DVDD3" to="net.V1V1" />
          <trace name="VREG_FB_V1V1" from=".U1 > .VREG_FB" to="net.V1V1" />
          <trace from=".U1 > .GND" to="net.GND" />
          <trace from=".U1 > .VREG_PGND" to="net.GND" />
          <trace from=".U1 > .VREG_LX" to="net.V1V1" />
          <trace name="C1_P" from=".C1 > .pin1" to="net.V3V3" />
          <trace name="C1_G" from=".C1 > .pin2" to="net.GND" />
          <trace name="C2_P" from=".C2 > .pin1" to="net.V3V3" />
          <trace name="C2_G" from=".C2 > .pin2" to="net.GND" />
          <trace name="C3_P" from=".C3 > .pin1" to="net.V3V3" />
          <trace name="C3_G" from=".C3 > .pin2" to="net.GND" />
          <trace name="C4_P" from=".C4 > .pin1" to="net.V3V3" />
          <trace name="C4_G" from=".C4 > .pin2" to="net.GND" />
          <trace from=".U1 > .USB_DM" to=".R_USB_DM > .pin1" />
          <trace from=".R_USB_DM > .pin2" to=".U_USB > .DM" />
          <trace from=".U1 > .USB_DP" to=".R_USB_DP > .pin1" />
          <trace from=".R_USB_DP > .pin2" to=".U_USB > .DP" />
          <trace from=".U_USB > .VBUS" to="net.V3V3" />
          <trace from=".U_USB > .GND" to="net.GND" />
        </subcircuit>

        <chip
          name="U_CONTROLS"
          footprint="soic16"
          pinLabels={{
            pin1: "GPIO0",
            pin2: "GPIO1",
            pin3: "GPIO2",
            pin4: "GPIO3",
            pin5: "GPIO4",
          }}
          pcbX={-34}
          pcbY={0}
          pcbRotation={90}
        />
        <chip
          name="U_DISPLAY_AUDIO"
          footprint="soic16"
          pinLabels={{
            pin1: "GPIO25",
            pin2: "GPIO26_ADC0",
            pin3: "GPIO27_ADC1",
            pin4: "GPIO28_ADC2",
            pin5: "GPIO29_ADC3",
            pin6: "NC1",
            pin7: "NC2",
          }}
          pcbX={34}
          pcbY={0}
          pcbRotation={90}
        />

        <trace
          name="LEFT_GPIO0"
          from=".U_CONTROLS > .GPIO0"
          to=".MCU .U1 > .GPIO0"
        />
        <trace
          name="LEFT_GPIO1"
          from=".U_CONTROLS > .GPIO1"
          to=".MCU .U1 > .GPIO1"
        />
        <trace
          name="LEFT_GPIO2"
          from=".U_CONTROLS > .GPIO2"
          to=".MCU .U1 > .GPIO2"
        />
        <trace
          name="LEFT_GPIO3"
          from=".U_CONTROLS > .GPIO3"
          to=".MCU .U1 > .GPIO3"
        />
        <trace
          name="LEFT_GPIO4"
          from=".U_CONTROLS > .GPIO4"
          to=".MCU .U1 > .GPIO4"
        />
        <trace
          name="RIGHT_GPIO25"
          from=".U_DISPLAY_AUDIO > .GPIO25"
          to=".MCU .U1 > .GPIO25"
        />
        <trace
          name="RIGHT_GPIO26_ADC0"
          from=".U_DISPLAY_AUDIO > .GPIO26_ADC0"
          to=".MCU .U1 > .GPIO26_ADC0"
        />
        <trace
          name="RIGHT_GPIO27_ADC1"
          from=".U_DISPLAY_AUDIO > .GPIO27_ADC1"
          to=".MCU .U1 > .GPIO27_ADC1"
        />
        <trace
          name="RIGHT_GPIO28_ADC2"
          from=".U_DISPLAY_AUDIO > .GPIO28_ADC2"
          to=".MCU .U1 > .GPIO28_ADC2"
        />
        <trace
          name="RIGHT_GPIO29_ADC3"
          from=".U_DISPLAY_AUDIO > .GPIO29_ADC3"
          to=".MCU .U1 > .GPIO29_ADC3"
        />

        <pcbnotetext
          pcbX={0}
          pcbY={25}
          fontSize={1.1}
          text="BUG: direct board-to-MCU routing after dense child routing (no headers)"
        />
      </board>,
    )

    await circuit.renderUntilSettled()

    expect(autoroutingPhaseIoStack.length).toBeGreaterThanOrEqual(2)
    const parentPhase = autoroutingPhaseIoStack.at(-1)
    expect(parentPhase?.startSimpleRouteJson?.connections).toHaveLength(10)
    expect(parentPhase?.startSimpleRouteJson?.traces?.length).toBeGreaterThan(
      30,
    )
    expect(circuit).toMatchPcbSnapshot(import.meta.path)

    // Desired behavior: the direct board-to-MCU routes complete without a
    // breakout component. This currently fails with "$F ran out of iterations".
    expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
    expect(circuit.db.pcb_trace_error.list()).toEqual([])
    expect(circuit.db.pcb_pad_trace_clearance_error.list()).toEqual([])
    expect(circuit.db.pcb_via_clearance_error.list()).toEqual([])
  },
  120_000,
)
