import { Fragment } from "react"
import { Am62lOsmSizeS } from "./am62l-osm-control-fanout-components"

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
  rgbBreakoutOrder.slice(0, 6),
  rgbBreakoutOrder.slice(6, 12),
  rgbBreakoutOrder.slice(12, 17),
  rgbBreakoutOrder.slice(17),
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

export const createAm62lOsmFullFanout = () => (
  <board
    width="70mm"
    height="70mm"
    layers={4}
    defaultTraceWidth="0.15mm"
    minTraceWidth="0.15mm"
    minTraceToPadEdgeClearance="0.1mm"
    minViaEdgeToPadEdgeClearance="0.1mm"
    minViaHoleDiameter="0.2mm"
    minViaPadDiameter="0.45mm"
    autorouterVersion="beta_pipeline9"
  >
    <copperpour layer="inner1" connectsTo="net.GND" clearance="0.15mm" />
    <copperpour layer="inner2" connectsTo="net.VCC_5V" clearance="0.15mm" />
    <pcbnotetext
      text="OSM-S AM62L: 32 signals + 58 GND + 6 VCC_5V escapes"
      pcbY={33.5}
      fontSize="0.8mm"
      anchorAlignment="center"
    />
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
      {rgbBuses.map((signals, busIndex) => (
        <Fragment key={`OSM_RGB_${busIndex}`}>
          <bus
            name={`OSM_RGB_${busIndex}`}
            connections={signals.map(getFanoutTraceName)}
            preferredLayer={busIndex % 2 === 0 ? "top" : "bottom"}
            preferredLayers={[busIndex % 2 === 0 ? "bottom" : "top"]}
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
  </board>
)
