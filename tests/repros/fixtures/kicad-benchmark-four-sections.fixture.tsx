const espPins = {
  pin1: "RESET",
  pin2: "ADC",
  pin3: "EN",
  pin4: "GPIO16",
  pin5: "GPIO14",
  pin6: "GPIO12",
  pin7: "GPIO13",
  pin8: "VCC",
  pin9: "CS0",
  pin10: "MISO",
  pin11: "GPIO9",
  pin12: "GPIO10",
  pin13: "MOSI",
  pin14: "SCLK",
  pin15: "GND",
  pin16: "GPIO15",
  pin17: "GPIO2",
  pin18: "GPIO0",
  pin19: "GPIO4",
  pin20: "GPIO5",
  pin21: "RXD",
  pin22: "TXD",
} as const

const uartPins = {
  pin1: "RST",
  pin2: "GPIO0",
  pin3: "GPIO1",
  pin4: "GND",
  pin5: "DPLUS",
  pin6: "DMINUS",
  pin7: "REGIN",
  pin8: "VDD",
  pin9: "VIO",
  pin10: "SUSPEND",
  pin11: "SUSPEND_N",
  pin12: "WAKEUP",
  pin13: "RI",
  pin14: "DCD",
  pin15: "DTR",
  pin16: "DSR",
  pin17: "TXD",
  pin18: "RXD",
  pin19: "RTS",
  pin20: "CTS",
  pin21: "GPIO2",
  pin22: "GPIO3",
  pin23: "CHREN",
  pin24: "NC",
  pin25: "EP",
} as const

const usbPins = {
  pin1: "GND1",
  pin2: "VBUS1",
  pin3: "CC1",
  pin4: "DP1",
  pin5: "DM1",
  pin6: "SBU1",
  pin7: "SBU2",
  pin8: "DM2",
  pin9: "DP2",
  pin10: "CC2",
  pin11: "VBUS2",
  pin12: "GND2",
  pin13: "SHELL1",
  pin14: "SHELL2",
  pin15: "SHELL3",
  pin16: "SHELL4",
} as const

const Esp12F = () => (
  <chip
    name="U1"
    manufacturerPartNumber="ESP-12F"
    pinLabels={espPins}
    layer="top"
    pcbX={-7}
    pcbY={0}
    schX={4}
    schY={0}
    schSectionName="MCU"
    noConnect={["CS0", "MISO", "GPIO9", "GPIO10", "MOSI", "SCLK"]}
    schPinArrangement={{
      leftSide: { pins: [1, 3, 18, 21, 2, 22], direction: "top-to-bottom" },
      rightSide: {
        pins: [4, 5, 6, 7, 16, 17, 19, 20],
        direction: "top-to-bottom",
      },
      topSide: { pins: [8], direction: "left-to-right" },
      bottomSide: { pins: [15], direction: "left-to-right" },
    }}
    footprint={
      <footprint>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((p, i) => (
          <Fragment key={p}>
            <smtpad
              shape="rect"
              width="1.5mm"
              height="1mm"
              pcbX="-8mm"
              pcbY={`${7 - 2 * i}mm`}
              portHints={[`pin${p}`]}
            />
          </Fragment>
        ))}
        {[15, 16, 17, 18, 19, 20, 21, 22].map((p, i) => (
          <Fragment key={p}>
            <smtpad
              shape="rect"
              width="1.5mm"
              height="1mm"
              pcbX="8mm"
              pcbY={`${-7 + 2 * i}mm`}
              portHints={[`pin${p}`]}
            />
          </Fragment>
        ))}
        {[9, 10, 11, 12, 13, 14].map((p, i) => (
          <Fragment key={p}>
            <smtpad
              shape="rect"
              width="1mm"
              height="1.5mm"
              pcbX={`${-5 + 2 * i}mm`}
              pcbY="-8mm"
              portHints={[`pin${p}`]}
            />
          </Fragment>
        ))}
        <silkscreenrect width="16mm" height="16mm" strokeWidth="0.2mm" />
      </footprint>
    }
  />
)

export default () => (
  <board width="42mm" height="34mm" schAutoLayoutEnabled>
    <net name="VBUS" />
    <net name="V3V3" />
    <net name="GND" isGroundNet />
    <schematicsection name="USB" />
    <schematicsection name="POWER" />
    <schematicsection name="MCU" />
    <schematicsection name="BOOT_STATUS" displayName="BOOT / STATUS" />

    <connector
      name="J1"
      standard="usb_c"
      manufacturerPartNumber="USB4105-GF-A"
      pinLabels={usbPins}
      layer="top"
      pcbX={18}
      pcbY={0}
      schX={-8}
      schY={0}
      schSectionName="USB"
      footprint={
        <footprint>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((p, i) => (
            <Fragment key={p}>
              <smtpad
                shape="rect"
                width="1.2mm"
                height="0.3mm"
                pcbX="-1.5mm"
                pcbY={`${2.75 - i * 0.5}mm`}
                portHints={[`pin${p}`]}
              />
            </Fragment>
          ))}
          <smtpad
            shape="rect"
            width="1.5mm"
            height="1.5mm"
            pcbX="-0.4mm"
            pcbY="4mm"
            portHints={["pin13"]}
          />
          <smtpad
            shape="rect"
            width="1.5mm"
            height="1.5mm"
            pcbX="1.4mm"
            pcbY="4mm"
            portHints={["pin14"]}
          />
          <smtpad
            shape="rect"
            width="1.5mm"
            height="1.5mm"
            pcbX="-0.4mm"
            pcbY="-4mm"
            portHints={["pin15"]}
          />
          <smtpad
            shape="rect"
            width="1.5mm"
            height="1.5mm"
            pcbX="1.4mm"
            pcbY="-4mm"
            portHints={["pin16"]}
          />
          <silkscreenrect
            pcbX="0.5mm"
            width="4mm"
            height="9mm"
            strokeWidth="0.2mm"
          />
        </footprint>
      }
    />
    <resistor
      name="RCC1"
      resistance="5.1k"
      footprint="0402"
      layer="top"
      pcbX={15}
      pcbY={4.5}
      schX={-5.8}
      schY={1}
      schSectionName="USB"
    />
    <resistor
      name="RCC2"
      resistance="5.1k"
      footprint="0402"
      layer="top"
      pcbX={15}
      pcbY={3.2}
      schX={-5.8}
      schY={0}
      schSectionName="USB"
    />
    <chip
      name="U2"
      manufacturerPartNumber="CP2102N-A02-GQFN24"
      pinLabels={uartPins}
      layer="top"
      pcbX={10.5}
      pcbY={0}
      schX={-4}
      schY={-1}
      schSectionName="USB"
      noConnect={[
        "RST",
        "GPIO0",
        "GPIO1",
        "SUSPEND",
        "SUSPEND_N",
        "WAKEUP",
        "RI",
        "DCD",
        "DTR",
        "DSR",
        "RTS",
        "CTS",
        "GPIO2",
        "GPIO3",
        "CHREN",
        "NC",
      ]}
      footprint={
        <footprint>
          {[1, 2, 3, 4, 5, 6].map((p, i) => (
            <Fragment key={p}>
              <smtpad
                shape="rect"
                width="0.8mm"
                height="0.25mm"
                pcbX="-2mm"
                pcbY={`${1.25 - i * 0.5}mm`}
                portHints={[`pin${p}`]}
              />
            </Fragment>
          ))}
          {[7, 8, 9, 10, 11, 12].map((p, i) => (
            <Fragment key={p}>
              <smtpad
                shape="rect"
                width="0.25mm"
                height="0.8mm"
                pcbX={`${-1.25 + i * 0.5}mm`}
                pcbY="-2mm"
                portHints={[`pin${p}`]}
              />
            </Fragment>
          ))}
          {[13, 14, 15, 16, 17, 18].map((p, i) => (
            <Fragment key={p}>
              <smtpad
                shape="rect"
                width="0.8mm"
                height="0.25mm"
                pcbX="2mm"
                pcbY={`${-1.25 + i * 0.5}mm`}
                portHints={[`pin${p}`]}
              />
            </Fragment>
          ))}
          {[19, 20, 21, 22, 23, 24].map((p, i) => (
            <Fragment key={p}>
              <smtpad
                shape="rect"
                width="0.25mm"
                height="0.8mm"
                pcbX={`${1.25 - i * 0.5}mm`}
                pcbY="2mm"
                portHints={[`pin${p}`]}
              />
            </Fragment>
          ))}
          <smtpad
            shape="rect"
            width="2.4mm"
            height="2.4mm"
            portHints={["pin25"]}
          />
          <silkscreenrect width="4mm" height="4mm" strokeWidth="0.15mm" />
        </footprint>
      }
    />
    <capacitor
      name="CUSB"
      capacitance="1uF"
      footprint="0402"
      layer="top"
      pcbX={10}
      pcbY={-3.2}
      pcbRotation={270}
      schOrientation="vertical"
      schX={-3.5}
      schY={1.7}
      schSectionName="USB"
    />

    <chip
      name="U3"
      manufacturerPartNumber="AP2112K-3.3TRG1"
      footprint="sot23_5"
      pinLabels={{
        pin1: "VIN",
        pin2: "GND",
        pin3: "EN",
        pin4: "NC",
        pin5: "VOUT",
      }}
      noConnect={["NC"]}
      layer="top"
      pcbX={2}
      pcbY={11}
      schX={-1}
      schY={1.28}
      schHeight="0.6mm"
      schSectionName="POWER"
    />
    <capacitor
      name="CIN"
      capacitance="10uF"
      footprint="0603"
      layer="top"
      pcbX={-5.5}
      pcbY={11}
      schOrientation="vertical"
      schX={0}
      schY={-1.3}
      schSectionName="POWER"
    />
    <capacitor
      name="COUT"
      capacitance="10uF"
      footprint="0603"
      layer="top"
      pcbX={-2}
      pcbY={11}
      schOrientation="vertical"
      schX={1}
      schY={0.8}
      schSectionName="POWER"
    />

    <Esp12F />
    <capacitor
      name="C1"
      capacitance="100nF"
      footprint="0402"
      layer="top"
      pcbX={2.8}
      pcbY={-4.8}
      schOrientation="vertical"
      schX={3.2}
      schY={-2.5}
      schSectionName="MCU"
    />
    <capacitor
      name="C2"
      capacitance="10uF"
      footprint="0603"
      layer="top"
      pcbX={3.2}
      pcbY={-7}
      schOrientation="vertical"
      schX={4.5}
      schY={-2.5}
      schSectionName="MCU"
    />
    <pinheader
      name="J_GPIO"
      pinCount={8}
      footprint="pinrow8_p2.54"
      layer="top"
      pcbX={-9}
      pcbY={14.5}
      schX={7}
      schY={0}
      schSectionName="MCU"
    />

    <resistor
      name="REN"
      resistance="10k"
      footprint="0402"
      layer="top"
      pcbX={-17.5}
      pcbY={-4.8}
      schX={2.28}
      schY={3.5}
      schSectionName="BOOT_STATUS"
    />
    <resistor
      name="RRST"
      resistance="10k"
      footprint="0402"
      layer="top"
      pcbX={-17.5}
      pcbY={-3.4}
      schX={2}
      schY={4.5}
      schSectionName="BOOT_STATUS"
    />
    <resistor
      name="RBOOT"
      resistance="10k"
      footprint="0402"
      layer="top"
      pcbX={-17.5}
      pcbY={-6.2}
      schX={4.16}
      schY={3.5}
      schSectionName="BOOT_STATUS"
    />
    <resistor
      name="R15"
      resistance="10k"
      footprint="0402"
      layer="top"
      pcbX={2.8}
      pcbY={-3.2}
      schX={5.72}
      schY={3.5}
      schSectionName="BOOT_STATUS"
    />
    <pushbutton
      name="SW_RST"
      footprint="pushbutton_smd_4.5x4.5"
      layer="top"
      pcbX={10}
      pcbY={11}
      schX={3.09}
      schY={5.2}
      schSectionName="BOOT_STATUS"
    />
    <pushbutton
      name="SW_BOOT"
      footprint="pushbutton_smd_4.5x4.5"
      layer="top"
      pcbX={17.5}
      pcbY={11}
      schX={5.31}
      schY={5.2}
      schSectionName="BOOT_STATUS"
    />
    <led
      name="LED_PWR"
      color="green"
      footprint="0603"
      layer="top"
      pcbX={7}
      pcbY={-12}
      schX={8.33}
      schY={3.5}
      schSectionName="BOOT_STATUS"
    />
    <resistor
      name="RPWR"
      resistance="1k"
      footprint="0402"
      layer="top"
      pcbX={9.5}
      pcbY={-12}
      schX={7.12}
      schY={3.5}
      schSectionName="BOOT_STATUS"
    />
    <led
      name="LED_TX"
      color="blue"
      footprint="0603"
      layer="top"
      pcbX={12}
      pcbY={-12}
      schX={8.45}
      schY={4.7}
      schSectionName="BOOT_STATUS"
    />
    <resistor
      name="RTX"
      resistance="1k"
      footprint="0402"
      layer="top"
      pcbX={14.5}
      pcbY={-12}
      schX={6.55}
      schY={4.7}
      schSectionName="BOOT_STATUS"
    />
    <led
      name="LED_IO2"
      color="amber"
      footprint="0603"
      layer="top"
      pcbX={17}
      pcbY={-12}
      schX={8.57}
      schY={5.9}
      schSectionName="BOOT_STATUS"
    />
    <resistor
      name="RIO2"
      resistance="1k"
      footprint="0402"
      layer="top"
      pcbX={19.5}
      pcbY={-12}
      schX={6.43}
      schY={5.9}
      schSectionName="BOOT_STATUS"
    />

    <trace from=".J1 > .VBUS1" to="net.VBUS" />
    <trace from=".J1 > .VBUS2" to="net.VBUS" />
    <trace from=".J1 > .GND1" to="net.GND" />
    <trace from=".J1 > .GND2" to="net.GND" />
    <trace from=".J1 > .SHELL1" to="net.GND" />
    <trace from=".J1 > .SHELL2" to="net.GND" />
    <trace from=".J1 > .SHELL3" to="net.GND" />
    <trace from=".J1 > .SHELL4" to="net.GND" />
    <trace from=".J1 > .CC1" to=".RCC1 > .pin1" />
    <trace from=".RCC1 > .pin2" to="net.GND" />
    <trace from=".J1 > .CC2" to=".RCC2 > .pin1" />
    <trace from=".RCC2 > .pin2" to="net.GND" />
    <trace from=".J1 > .DP1" to=".U2 > .DPLUS" />
    <trace from=".J1 > .DP2" to=".U2 > .DPLUS" />
    <trace from=".J1 > .DM1" to=".U2 > .DMINUS" />
    <trace from=".J1 > .DM2" to=".U2 > .DMINUS" />
    <trace from=".U2 > .REGIN" to="net.VBUS" />
    <trace from=".U2 > .VDD" to=".CUSB > .pin1" maxLength="5mm" />
    <trace from=".U2 > .VIO" to=".CUSB > .pin1" maxLength="5mm" />
    <trace from=".CUSB > .pin2" to="net.GND" maxLength="5mm" />
    <trace from=".U2 > .GND" to="net.GND" />
    <trace from=".U2 > .EP" to="net.GND" />
    <trace from=".U2 > .TXD" to=".U1 > .RXD" />
    <trace from=".U2 > .RXD" to=".U1 > .TXD" />
    <trace from=".U3 > .VIN" to="net.VBUS" />
    <trace from=".U3 > .EN" to="net.VBUS" />
    <trace from=".U3 > .GND" to="net.GND" />
    <trace from=".U3 > .VOUT" to="net.V3V3" />
    <trace from=".CIN > .pin1" to="net.VBUS" />
    <trace from=".CIN > .pin2" to="net.GND" />
    <trace from=".COUT > .pin1" to="net.V3V3" />
    <trace from=".COUT > .pin2" to="net.GND" />
    <trace from=".U1 > .VCC" to="net.V3V3" />
    <trace from=".U1 > .GND" to="net.GND" />
    <trace from=".C1 > .pin1" to="net.V3V3" />
    <trace from=".C1 > .pin2" to="net.GND" />
    <trace from=".C2 > .pin1" to="net.V3V3" />
    <trace from=".C2 > .pin2" to="net.GND" />
    <trace from=".U1 > .RESET" to=".RRST > .pin1" />
    <trace from=".RRST > .pin2" to="net.V3V3" />
    <trace from=".U1 > .EN" to=".REN > .pin1" />
    <trace from=".REN > .pin2" to="net.V3V3" />
    <trace from=".U1 > .GPIO0" to=".RBOOT > .pin1" />
    <trace from=".RBOOT > .pin2" to="net.V3V3" />
    <trace from=".U1 > .GPIO15" to=".R15 > .pin1" />
    <trace from=".R15 > .pin2" to="net.GND" />
    <trace from=".SW_RST > .pin1" to=".U1 > .RESET" />
    <trace from=".SW_RST > .pin2" to="net.GND" />
    <trace from=".SW_BOOT > .pin1" to=".U1 > .GPIO0" />
    <trace from=".SW_BOOT > .pin2" to="net.GND" />
    <trace from="net.V3V3" to=".RPWR > .pin1" />
    <trace from=".RPWR > .pin2" to=".LED_PWR > .anode" />
    <trace from=".LED_PWR > .cathode" to="net.GND" />
    <trace from=".U2 > .TXD" to=".RTX > .pin1" />
    <trace from=".RTX > .pin2" to=".LED_TX > .anode" />
    <trace from=".LED_TX > .cathode" to="net.GND" />
    <trace from=".U1 > .GPIO2" to=".RIO2 > .pin1" />
    <trace from=".RIO2 > .pin2" to=".LED_IO2 > .anode" />
    <trace from=".LED_IO2 > .cathode" to="net.GND" />
    <trace from=".J_GPIO > .pin1" to="net.V3V3" />
    <trace from=".J_GPIO > .pin2" to="net.GND" />
    <trace from=".J_GPIO > .pin3" to=".U1 > .GPIO4" />
    <trace from=".J_GPIO > .pin4" to=".U1 > .GPIO5" />
    <trace from=".J_GPIO > .pin5" to=".U1 > .GPIO12" />
    <trace from=".J_GPIO > .pin6" to=".U1 > .GPIO13" />
    <trace from=".J_GPIO > .pin7" to=".U1 > .GPIO14" />
    <trace from=".J_GPIO > .pin8" to=".U1 > .GPIO16" />

    <silkscreenrect
      pcbX={-14.5}
      pcbY={5}
      width="9mm"
      height="5mm"
      strokeWidth="0.2mm"
    />
    <silkscreentext
      text="ANTENNA - KEEP CLEAR"
      pcbX={-14.5}
      pcbY={5}
      fontSize="0.45mm"
    />
    <silkscreentext text="ESP-12F MINI" pcbX={2} pcbY={16} fontSize="0.8mm" />
    <silkscreentext text="RST" pcbX={10} pcbY={15.5} fontSize="0.6mm" />
    <silkscreentext text="BOOT" pcbX={17} pcbY={15.5} fontSize="0.6mm" />
  </board>
)
import { Fragment } from "react"
