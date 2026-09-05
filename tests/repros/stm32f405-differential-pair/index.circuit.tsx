import { TAXM8M4RFDCET2T } from "./imports/TAXM8M4RFDCET2T"
import { UsbFootprint } from "./imports/UsbFootprint"
import { STM32F405RGT6 } from "./imports/STM32F405RGT6"
import { LSM6DS3TR_C } from "./imports/LSM6DS3TR_C"
import { TLV75533PDBVR } from "./imports/TLV75533PDBVR"
import { USBLC6_2SC6 } from "./imports/USBLC6_2SC6"
import { TS_1187A_B_A_B } from "./imports/TS_1187A_B_A_B"

// Physical LQFP64 pin numbers, checked against ST DS8626.
const mcuNets: Record<number, string> = {
  1: "V3_3",
  2: "STATUS",
  5: "OSC_IN",
  6: "OSC_OUT",
  7: "NRST",
  8: "GPIO_PC0",
  9: "GPIO_PC1",
  12: "GND",
  13: "VDDA",
  14: "GPIO_PA0",
  15: "GPIO_PA1",
  16: "UART2_TX",
  17: "UART2_RX",
  18: "GND",
  19: "V3_3",
  28: "BOOT1",
  31: "VCAP1",
  32: "V3_3",
  41: "IMU_INT",
  42: "VBUS",
  44: "USB_DM",
  45: "USB_DP",
  46: "SWDIO",
  47: "VCAP2",
  48: "V3_3",
  49: "SWCLK",
  55: "SWO",
  58: "I2C_SCL",
  59: "I2C_SDA",
  60: "BOOT0",
  63: "GND",
  64: "V3_3",
}
// name, value, PCB x/y, rotation, rail; capacitors are ceramic, >=10 V.
const caps: [string, string, number, number, number, string][] = [
  ["C1", "100nF", 8, -2.8, 90, "V3_3"],
  ["C2", "100nF", 8, 4, 90, "V3_3"],
  ["C3", "100nF", -4.2, 8, 0, "V3_3"],
  ["C4", "100nF", -8, -3.3, 90, "V3_3"],
  ["C5", "100nF", -4.5, -8, 0, "V3_3"],
  ["C6", "4.7uF", -7, 7.8, 0, "V3_3"],
  ["C7", "2.2uF", 8, 2, 90, "VCAP1"],
  ["C8", "2.2uF", -2.2, 7.3, 0, "VCAP2"],
  ["C9", "100nF", 2.3, -8, 0, "VDDA"],
  ["C10", "1uF", 4.8, -8, 0, "VDDA"],
  ["C11", "100nF", -10, -2.7, 0, "V3_3"],
  ["C12", "100nF", -13, -2.7, 0, "V3_3"],
  ["C13", "1uF", 15, 9, 90, "VBUS"],
  ["C14", "4.7uF", 9, 9, 90, "V3_3"],
  ["C15", "100nF", -0.5, -8, 0, "NRST"],
  ["C16", "18pF", -5, -12, 90, "OSC_IN"],
  ["C17", "18pF", 2, -11, 90, "OSC_OUT"],
]
const resistors: [string, string, number, number, number, string, string][] = [
  ["R1", "5.1k", -6, 11, 90, "CC1", "GND"],
  ["R2", "5.1k", 6, 11, 90, "CC2", "GND"],
  ["R3", "22", 0, 7.3, 0, "USB_DP", "USB_DP_CONN"],
  ["R4", "22", 2.1, 7.3, 0, "USB_DM", "USB_DM_CONN"],
  ["R5", "10k", -6, -10, 90, "V3_3", "NRST"],
  ["R6", "10k", -9, 0, 90, "BOOT0", "GND"],
  ["R7", "10k", 8, 0, 90, "BOOT1", "GND"],
  ["R8", "4.7k", -10, 3, 90, "V3_3", "I2C_SCL"],
  ["R9", "4.7k", -12, 3, 90, "V3_3", "I2C_SDA"],
  ["R10", "1k", -10, -6, 0, "STATUS", "LED_A"],
  ["R11", "10", 6.5, -8, 90, "V3_3", "VDDA"],
]
const wire = (pin: string, net: string) => (
  <trace key={pin} from={pin} to={`net.${net}`} />
)
export default function Controller({
  routingDisabled = false,
}: { routingDisabled?: boolean }) {
  return (
    <board
      routingDisabled={routingDisabled}
      width={40}
      height={38}
      layers={4}
      thickness={1.6}
      title="F405 compact USB IMU controller"
      autorouter="auto-local"
      minTraceWidth={0.15}
      minTraceToPadEdgeClearance={0.15}
      minViaHoleDiameter={0.3}
      minViaPadDiameter={0.6}
      schTraceAutoLabelEnabled
      schMaxTraceDistance={3}
    >
      {/* Drop supply connections to their planes before routing sensitive signals. */}
      <autoroutingphase
        name="Power plane fanout"
        phaseIndex={0}
        autorouter="fanout"
        connections={["net.GND", "net.V3_3"]}
        fanoutRoutingLayers={["top", "bottom"]}
        fanoutPourNetMap={{ inner1: "GND", inner2: "V3_3" }}
      />
      <autoroutingphase
        name="USB data"
        phaseIndex={1}
        autorouter="auto-local"
        connections={[
          "net.USB_DP",
          "net.USB_DM",
          "net.USB_DP_CONN",
          "net.USB_DM_CONN",
        ]}
      />
      <autoroutingphase
        name="Crystal"
        phaseIndex={2}
        autorouter="auto-local"
        connections={["net.OSC_IN", "net.OSC_OUT"]}
      />
      <autoroutingphase name="Remaining signals" autorouter="auto-local" />
      {["MCU", "Decoupling", "USB", "Power", "IMU", "Controls", "Headers"].map(
        (name) => (
          <schematicsection name={name} />
        ),
      )}
      <STM32F405RGT6
        name="U1"
        pcbX={0}
        pcbY={0}
        schX={0}
        schY={0}
        schWidth={2.34}
        schHeight={6.6}
        schSectionName="MCU"
      />
      {Object.entries(mcuNets).map(([pin, net]) =>
        wire(`.U1 > .pin${pin}`, net),
      )}
      <connector
        name="J1"
        standard="usb_c"
        footprint={<UsbFootprint />}
        manufacturerPartNumber="TYPE-C-31-M-12"
        supplierPartNumbers={{ jlcpcb: ["C165948"] }}
        pinLabels={{
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
        }}
        pcbX={0}
        pcbY={15}
        pcbRotation={180}
        schPortArrangement={{
          rightSide: {
            pins: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
            direction: "top-to-bottom",
          },
        }}
        schWidth={1.65}
        schHeight={3.4}
        schX={25}
        schY={12}
        schSectionName="USB"
      />
      {Object.entries({
        GND1: "GND",
        GND2: "GND",
        VBUS1: "VBUS",
        VBUS2: "VBUS",
        CC1: "CC1",
        CC2: "CC2",
        DP1: "USB_DP_CONN",
        DP2: "USB_DP_CONN",
        DM1: "USB_DM_CONN",
        DM2: "USB_DM_CONN",
        SHELL1: "GND",
        SHELL2: "GND",
        SHELL3: "GND",
        SHELL4: "GND",
      }).map(([p, n]) => wire(`.J1 > .${p}`, n))}
      <USBLC6_2SC6
        name="U4"
        pcbX={0}
        pcbY={10}
        pcbRotation={90}
        schX={34}
        schY={12}
        schSectionName="USB"
        internallyConnectedPins={[
          [1, 6],
          [3, 4],
        ]}
      />
      {Object.entries({
        1: "USB_DP_CONN",
        2: "GND",
        3: "USB_DM_CONN",
        4: "USB_DM_CONN",
        5: "VBUS",
        6: "USB_DP_CONN",
      }).map(([p, n]) => wire(`.U4 > .pin${p}`, n))}
      <differentialpair
        name="USB_FS"
        positiveConnection=".U1 > .pin45"
        negativeConnection=".U1 > .pin44"
        targetDifferentialImpedance={90}
        maxLengthSkew={0.5}
        pcbTraceGap={0.15}
      />
      <TLV75533PDBVR
        name="U3"
        schHeight={0.6}
        pcbX={12}
        pcbY={10}
        schX={25}
        schY={-2}
        schSectionName="Power"
      />
      {Object.entries({ 1: "VBUS", 2: "GND", 3: "VBUS", 5: "V3_3" }).map(
        ([p, n]) => wire(`.U3 > .pin${p}`, n),
      )}
      <LSM6DS3TR_C
        name="U2"
        pcbX={-12}
        pcbY={0}
        schX={25}
        schY={-14}
        schSectionName="IMU"
      />
      {Object.entries({
        1: "GND",
        4: "IMU_INT",
        5: "V3_3",
        6: "GND",
        7: "GND",
        8: "V3_3",
        12: "V3_3",
        13: "I2C_SCL",
        14: "I2C_SDA",
      }).map(([p, n]) => wire(`.U2 > .pin${p}`, n))}
      {caps.map(([name, value, x, y, rot, net], i) => (
        <capacitor
          key={name}
          name={name}
          capacitance={value}
          schOrientation="vertical"
          footprint="0402"
          pcbX={x}
          pcbY={y}
          pcbRotation={rot}
          schX={-25 + (i % 4) * 5}
          schY={15 - Math.floor(i / 4) * 5}
          schSectionName="Decoupling"
          connections={{ pin1: `net.${net}`, pin2: "net.GND" }}
        />
      ))}
      {resistors.map(([name, value, x, y, rot, n1, n2], i) => (
        <resistor
          key={name}
          name={name}
          resistance={value}
          footprint="0402"
          pcbX={x}
          pcbY={y}
          pcbRotation={rot}
          schX={-25 + (i % 4) * 5}
          schY={-15 - Math.floor(i / 4) * 5}
          schSectionName="Controls"
          connections={{ pin1: `net.${n1}`, pin2: `net.${n2}` }}
        />
      ))}
      <TS_1187A_B_A_B
        name="SW1"
        pcbX={-11}
        pcbY={-13.5}
        schX={25}
        schY={-25}
        schSectionName="Controls"
        internallyConnectedPins={[
          [1, 3],
          [2, 4],
        ]}
      />
      <TS_1187A_B_A_B
        name="SW2"
        pcbX={11}
        pcbY={-13.5}
        schX={33}
        schY={-25}
        schSectionName="Controls"
        internallyConnectedPins={[
          [1, 3],
          [2, 4],
        ]}
      />
      {[1, 3].map((p) => wire(`.SW1 > .pin${p}`, "NRST"))}
      {[2, 4].map((p) => wire(`.SW1 > .pin${p}`, "GND"))}
      {[1, 3].map((p) => wire(`.SW2 > .pin${p}`, "BOOT0"))}
      {[2, 4].map((p) => wire(`.SW2 > .pin${p}`, "V3_3"))}
      <led
        name="D1"
        color="green"
        footprint="0603"
        pcbX={-13}
        pcbY={-6}
        schX={41}
        schY={-25}
        schSectionName="Controls"
        connections={{ anode: "net.LED_A", cathode: "net.GND" }}
      />
      <TAXM8M4RFDCET2T
        name="Y1"
        loadCapacitance="12pF"
        pcbX={-1.5}
        pcbY={-11}
        schX={0}
        schY={-20}
        schSectionName="MCU"
        connections={{
          pin1: "net.OSC_IN",
          pin2: "net.GND",
          pin3: "net.OSC_OUT",
          pin4: "net.GND",
        }}
      />
      {(
        [
          ["J2", -17, 8.7, ["V3_3", "SWDIO", "GND", "SWCLK", "NRST", "SWO"]],
          ["J3", 17, -2, ["GND", "V3_3", "UART2_TX", "UART2_RX"]],
          [
            "J4",
            -17,
            -8.7,
            ["GND", "V3_3", "GPIO_PC0", "GPIO_PC1", "GPIO_PA0", "GPIO_PA1"],
          ],
        ] as [string, number, number, string[]][]
      ).map(([name, x, y, nets], i) => (
        <pinheader
          key={name}
          name={name}
          pinCount={nets.length}
          pitch={2.54}
          footprint={`pinrow${nets.length}`}
          pcbX={x}
          pcbY={y}
          pcbRotation={90}
          schX={48 + i * 8}
          schY={8}
          schSectionName="Headers"
          connections={Object.fromEntries(
            nets.map((n, i) => [`pin${i + 1}`, `net.${n}`]),
          )}
        />
      ))}
      <copperpour
        connectsTo="net.GND"
        layer="inner1"
        clearance={0.2}
        boardEdgeMargin={0.3}
      />
      <copperpour
        connectsTo="net.V3_3"
        layer="inner2"
        clearance={0.2}
        boardEdgeMargin={0.3}
      />
      <copperpour
        connectsTo="net.GND"
        layer="bottom"
        clearance={0.2}
        boardEdgeMargin={0.3}
      />
      <silkscreentext
        text="F405 USB / IMU"
        pcbX={11}
        pcbY={15.6}
        fontSize={0.8}
      />
      <silkscreentext text="RESET" pcbX={-11} pcbY={-17} fontSize={0.7} />
      <silkscreentext text="BOOT" pcbX={11} pcbY={-17} fontSize={0.7} />
    </board>
  )
}
