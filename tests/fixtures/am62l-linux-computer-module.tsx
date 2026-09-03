import { Fragment } from "react"
import {
  Am62lOsmSizeS,
  ConsoleHeader,
  HxTactileSwitch,
  Sii9022Acnu,
  UsbCDataPort,
} from "./am62l-osm-control-fanout-components"

const osmGroundPads = [
  "A4",
  "A7",
  "A10",
  "B2",
  "B5",
  "B8",
  "B9",
  "C11",
  "D1",
  "D5",
  "D8",
  "D18",
  "E2",
  "E15",
  "E21",
  "F16",
  "F20",
  "H2",
  "H4",
  "J16",
  "J20",
  "L2",
  "L4",
  "L18",
  "M16",
  "M20",
  "P2",
  "P4",
  "P18",
  "R1",
  "R16",
  "R20",
  "U2",
  "U4",
  "V1",
  "V16",
  "V20",
  "W3",
  "Y2",
  "Y18",
  "AA1",
  "AA4",
  "AA7",
  "AA8",
  "AA10",
  "AA11",
  "AA14",
  "AA17",
  "AA19",
  "AA22",
  "AB3",
  "AB6",
  "AB9",
  "AB15",
  "AB21",
  "AC4",
  "AC7",
  "AC10",
] as const

const osm5vPads = [
  "VCC_IN_5V_1",
  "VCC_IN_5V_2",
  "VCC_IN_5V_3",
  "VCC_IN_5V_4",
  "VCC_IN_5V_5",
  "USB_A_VBUS",
] as const

const rgbBreakoutOrder = [
  "RGB_DE",
  "RGB_HSYNC",
  "RGB_VSYNC",
  "RGB_B5",
  "RGB_PIXELCLK",
  "RGB_B3",
  "RGB_B4",
  "RGB_B2",
  "RGB_B1",
  "RGB_B0",
  "RGB_G4",
  "RGB_G5",
  "RGB_G3",
  "RGB_G1",
  "RGB_G2",
  "RGB_G0",
  "RGB_R5",
  "RGB_R4",
  "RGB_R2",
  "RGB_R0",
  "RGB_R3",
  "RGB_R1",
] as const

const rgbBuses = [
  ["OSM_RGB_0", rgbBreakoutOrder.slice(0, 6), "top", "bottom"],
  ["OSM_RGB_1", rgbBreakoutOrder.slice(6, 12), "bottom", "top"],
  ["OSM_RGB_2", rgbBreakoutOrder.slice(12, 17), "top", "bottom"],
  ["OSM_RGB_3", rgbBreakoutOrder.slice(17), "bottom", "top"],
] as const

const signalBreakouts = [
  ["USB_A_D_N", 3.5, 32],
  ["USB_A_D_P", 2, 32],
  ["I2C_A_SCL", -8, 32],
  ["I2C_A_SDA", -12, 32],
  ["RESET_IN_N", -32, 12],
  ["FORCE_RECOVERY_N", -32, 10],
  ["RESET_OUT_N", -32, 8],
  ["CONSOLE_RX", -32, -3],
  ["CONSOLE_TX", -32, -4.5],
  ...rgbBreakoutOrder.map(
    (signal, signalIndex) =>
      [
        signal,
        32,
        -12 + (24 * signalIndex) / (rgbBreakoutOrder.length - 1),
      ] as const,
  ),
] as const

const getFanoutTraceName = (signal: string) => `OSM_FANOUT_${signal}`

const sii9022RgbConnections = [
  ["RGB_R0", "D18"],
  ["RGB_R1", "D19"],
  ["RGB_R2", "D20"],
  ["RGB_R3", "D21"],
  ["RGB_R4", "D22"],
  ["RGB_R5", "D23"],
  ["RGB_G0", "D10"],
  ["RGB_G1", "D11"],
  ["RGB_G2", "D12"],
  ["RGB_G3", "D13"],
  ["RGB_G4", "D14"],
  ["RGB_G5", "D15"],
  ["RGB_B0", "D2"],
  ["RGB_B1", "D3"],
  ["RGB_B2", "D4"],
  ["RGB_B3", "D5"],
  ["RGB_B4", "D6"],
  ["RGB_B5", "D7"],
  ["RGB_PIXELCLK", "IDCK"],
  ["RGB_VSYNC", "VSYNC"],
  ["RGB_HSYNC", "HSYNC"],
  ["RGB_DE", "DE"],
] as const

export const Am62lLinuxComputerModule = () => (
  <subcircuit name="AM62L_COMPUTE_MODULE">
    <breakout
      name="OSM_REGION"
      width="66mm"
      height="66mm"
      autorouter={{ preset: "fanout", allowViaInPad: false }}
      autorouterVersion="beta_pipeline9"
      fanoutRoutingLayers={["top", "bottom"]}
      fanoutPourNetMap={{ inner1: "GND", inner2: "VCC_5V" }}
      busFanoutDirections={{
        OSM_USB: "topside_center",
        OSM_I2C: "topside_left",
        OSM_CONTROL: "leftside_center",
        OSM_CONSOLE: "leftside_center",
        OSM_RGB_0: "rightside_bottom",
        OSM_RGB_1: "rightside_center",
        OSM_RGB_2: "rightside_center",
        OSM_RGB_3: "rightside_top",
        OSM_1V8: "leftside_center",
      }}
    >
      <bus
        name="OSM_USB"
        connections={["USB_A_D_N", "USB_A_D_P"].map(getFanoutTraceName)}
        preferredLayer="top"
      />
      <bus
        name="OSM_I2C"
        connections={["I2C_A_SCL", "I2C_A_SDA"].map(getFanoutTraceName)}
        preferredLayer="bottom"
      />
      <bus
        name="OSM_CONTROL"
        connections={["RESET_IN_N", "FORCE_RECOVERY_N", "RESET_OUT_N"].map(
          getFanoutTraceName,
        )}
        preferredLayer="top"
        preferredLayers={["bottom"]}
      />
      <bus
        name="OSM_CONSOLE"
        connections={["CONSOLE_RX", "CONSOLE_TX"].map(getFanoutTraceName)}
        preferredLayer="top"
        preferredLayers={["bottom"]}
      />
      {rgbBuses.map(([busName, signals, preferredLayer, alternateLayer]) => (
        <Fragment key={busName}>
          <bus
            name={busName}
            connections={signals.map(getFanoutTraceName)}
            preferredLayer={preferredLayer}
            preferredLayers={[alternateLayer]}
          />
        </Fragment>
      ))}
      <bus
        name="OSM_1V8"
        connections={[getFanoutTraceName("VCC_OUT_IO_1V8")]}
      />

      <Am62lOsmSizeS name="U1" pcbRotation={180} />
      {signalBreakouts.map(([signal, pcbX, pcbY]) => (
        <Fragment key={signal}>
          <fanoutpoint
            connection={`.U1 > .${signal}`}
            pcbX={pcbX}
            pcbY={pcbY}
          />
          <trace
            name={getFanoutTraceName(signal)}
            from={`.U1 > .${signal}`}
            to={`net.OSM_BREAKOUT_${signal}`}
          />
        </Fragment>
      ))}
      <fanoutpoint connection=".U1 > .VCC_OUT_IO_1V8" pcbX={-32} pcbY={4} />
      <trace
        name={getFanoutTraceName("VCC_OUT_IO_1V8")}
        from=".U1 > .VCC_OUT_IO_1V8"
        to="net.OSM_BREAKOUT_VCC_OUT_IO_1V8"
        thickness="0.25mm"
      />
      {osmGroundPads.map((pad) => (
        <trace
          key={`U1_GND_${pad}`}
          name={`U1_GND_${pad}`}
          from={`.U1 > .${pad}`}
          to="net.GND"
          thickness="0.25mm"
        />
      ))}
      {osm5vPads.map((pad) => (
        <trace
          key={`U1_VCC_5V_${pad}`}
          name={`U1_VCC_5V_${pad}`}
          from={`.U1 > .${pad}`}
          to="net.VCC_5V"
          thickness="0.4mm"
        />
      ))}
    </breakout>

    <Sii9022Acnu name="U5" pcbX={43} pcbY={0} pcbRotation={180} />
    <UsbCDataPort name="J1" pcbX={0} pcbY={43} />
    <HxTactileSwitch name="SW1" pcbX={-43} pcbY={12} />
    <HxTactileSwitch name="SW2" pcbX={-43} pcbY={4} />
    <ConsoleHeader name="J2" pcbX={-43} pcbY={-8} />
    <pcbnotetext
      text="SII9022 HDMI TX: RGB + I2C + RESET"
      pcbX={43}
      pcbY={8}
      fontSize="0.7mm"
      anchorAlignment="center"
    />
    <pcbnotetext
      text="USB-C: USB2 D+ / D-"
      pcbX={0}
      pcbY={48}
      fontSize="0.7mm"
      anchorAlignment="center"
    />
    <pcbnotetext
      text="RESET / RECOVERY"
      pcbX={-43}
      pcbY={17}
      fontSize="0.7mm"
      anchorAlignment="center"
    />
    <pcbnotetext
      text="UART CONSOLE"
      pcbX={-43}
      pcbY={-13}
      fontSize="0.7mm"
      anchorAlignment="center"
    />

    {sii9022RgbConnections.map(([osmSignal, sii9022Pin]) => (
      <trace
        key={`U5_${sii9022Pin}`}
        name={`HDMI_${osmSignal}`}
        from={`.U5 > .${sii9022Pin}`}
        to={`net.OSM_BREAKOUT_${osmSignal}`}
      />
    ))}
    <trace
      name="USB_DN_TO_CONNECTOR"
      from=".J1 > .USB_DN"
      to="net.OSM_BREAKOUT_USB_A_D_N"
    />
    <trace
      name="USB_DP_TO_CONNECTOR"
      from=".J1 > .USB_DP"
      to="net.OSM_BREAKOUT_USB_A_D_P"
    />
    <trace
      name="HDMI_I2C_SCL"
      from=".U5 > .CSCL"
      to="net.OSM_BREAKOUT_I2C_A_SCL"
    />
    <trace
      name="HDMI_I2C_SDA"
      from=".U5 > .CSDA"
      to="net.OSM_BREAKOUT_I2C_A_SDA"
    />
    <trace
      name="MODULE_RESET_BUTTON"
      from=".SW1 > .pin1"
      to="net.OSM_BREAKOUT_RESET_IN_N"
    />
    <trace name="RESET_BUTTON_GROUND" from=".SW1 > .pin2" to="net.GND" />
    <trace
      name="MODULE_RECOVERY_BUTTON"
      from=".SW2 > .pin1"
      to="net.OSM_BREAKOUT_FORCE_RECOVERY_N"
    />
    <trace name="RECOVERY_BUTTON_GROUND" from=".SW2 > .pin2" to="net.GND" />
    <trace
      name="HDMI_RESET"
      from=".U5 > .RESET"
      to="net.OSM_BREAKOUT_RESET_OUT_N"
    />
    <trace
      name="UART_RX_TEST"
      from=".J2 > .UART_RX"
      to="net.OSM_BREAKOUT_CONSOLE_RX"
    />
    <trace
      name="UART_TX_TEST"
      from=".J2 > .UART_TX"
      to="net.OSM_BREAKOUT_CONSOLE_TX"
    />
    <trace
      name="HDMI_IO_1V8"
      from=".U5 > .IOVCC1"
      to="net.OSM_BREAKOUT_VCC_OUT_IO_1V8"
      thickness="0.25mm"
    />
  </subcircuit>
)
