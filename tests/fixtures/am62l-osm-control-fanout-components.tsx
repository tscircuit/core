import type { ChipProps } from "@tscircuit/props"
import { Fragment } from "react"

const osmRows = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "J",
  "K",
  "L",
  "M",
  "N",
  "P",
  "R",
  "T",
  "U",
  "V",
  "W",
  "Y",
  "AA",
  "AB",
  "AC",
] as const

const osmFullEdgeColumns = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
]
const osmCornerRowColumns = [
  2, 3, 4, 5, 6, 7, 8, 9, 10, 14, 15, 16, 17, 18, 19, 20, 21, 22,
]
const osmSideColumns = [1, 2, 3, 4, 15, 16, 17, 18, 19, 20, 21]

const osmPadNames = osmRows.flatMap((row) => {
  if (row === "A" || row === "AC") {
    return osmCornerRowColumns.map((column) => `${row}${column}`)
  }
  if (["B", "C", "D", "Y", "AA", "AB"].includes(row)) {
    const columns =
      row === "B"
        ? osmFullEdgeColumns.filter((column) => column !== 14)
        : osmFullEdgeColumns
    return columns.map((column) => `${row}${column}`)
  }
  return osmSideColumns.map((column) => `${row}${column}`)
})

if (osmPadNames.length !== 332) {
  throw new Error(
    `OSM Size-S footprint must have 332 lands, got ${osmPadNames.length}`,
  )
}

const osmSignalAliases: Record<string, string> = {
  Y8: "VCC_IN_5V_1",
  Y9: "VCC_IN_5V_2",
  Y10: "VCC_IN_5V_3",
  Y11: "VCC_IN_5V_4",
  Y17: "VCC_IN_5V_5",
  U18: "VCC_OUT_IO_1V8",
  U17: "RESET_IN_N",
  T17: "FORCE_RECOVERY_N",
  Y14: "RESET_OUT_N",
  D22: "CONSOLE_RX",
  D23: "CONSOLE_TX",
  AA15: "I2C_A_SCL",
  AA16: "I2C_A_SDA",
  AB13: "USB_A_D_N",
  AC14: "USB_A_D_P",
  AB14: "USB_A_ID",
  AB16: "USB_A_VBUS",
  Y7: "RGB_R0",
  AA6: "RGB_R1",
  Y6: "RGB_R2",
  AA5: "RGB_R3",
  Y5: "RGB_R4",
  Y4: "RGB_R5",
  W4: "RGB_G0",
  V3: "RGB_G1",
  V4: "RGB_G2",
  U3: "RGB_G3",
  T3: "RGB_G4",
  T4: "RGB_G5",
  R4: "RGB_B0",
  R3: "RGB_B1",
  P3: "RGB_B2",
  N3: "RGB_B3",
  N4: "RGB_B4",
  M3: "RGB_B5",
  M4: "RGB_PIXELCLK",
  L3: "RGB_VSYNC",
  K3: "RGB_HSYNC",
  J4: "RGB_DE",
}

const osmPinLabels = Object.fromEntries(
  osmPadNames.map((padName, index) => [
    `pin${index + 1}`,
    osmSignalAliases[padName]
      ? [padName, osmSignalAliases[padName]]
      : [padName],
  ]),
) as Record<string, string[]>

const osmRowIndexByName = new Map(
  osmRows.map((row, rowIndex) => [row, rowIndex]),
)

const getOsmPadPosition = (padName: string) => {
  const match = /^([A-Z]+)(\d+)$/.exec(padName)
  if (!match) throw new Error(`Invalid OSM land name ${padName}`)
  const rowIndex = osmRowIndexByName.get(match[1] as (typeof osmRows)[number])
  if (rowIndex === undefined) throw new Error(`Invalid OSM row ${match[1]}`)
  return {
    x: (Number(match[2]) - 12) * 1.25,
    y: (11 - rowIndex) * 1.25,
  }
}

export const Am62lOsmSizeS = (props: ChipProps<typeof osmPinLabels>) => (
  <chip
    pinLabels={osmPinLabels}
    manufacturerPartNumber="SOM-OSM-S-AM62L"
    obstructsWithinBounds={false}
    footprint={
      <footprint>
        {osmPadNames.map((padName, padIndex) => {
          const position = getOsmPadPosition(padName)
          return (
            <Fragment key={padName}>
              <smtpad
                portHints={[`pin${padIndex + 1}`]}
                pcbX={position.x}
                pcbY={position.y}
                shape="circle"
                radius="0.4mm"
                solderMaskMargin="0.05mm"
                solderPasteMargin="0mm"
              />
            </Fragment>
          )
        })}
        <silkscreenrect pcbX={0} pcbY={0} width="30mm" height="30mm" />
        <silkscreentext
          text="OSM-S AM62L"
          pcbX={0}
          pcbY="16.2mm"
          anchorAlignment="center"
          fontSize="1mm"
        />
        <silkscreencircle pcbX="-13.75mm" pcbY="13.75mm" radius="0.65mm" />
        <courtyardrect pcbX={0} pcbY={0} width="31mm" height="31mm" />
      </footprint>
    }
    {...props}
  />
)

const switchPinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"],
} as const

export const HxTactileSwitch = (props: ChipProps<typeof switchPinLabels>) => (
  <chip
    pinLabels={switchPinLabels}
    manufacturerPartNumber="HX 3x4x2-2P-1.6N TACTILE SWITCH"
    supplierPartNumbers={{ jlcpcb: ["C49234124"] }}
    footprint={
      <footprint>
        <smtpad
          portHints={["pin1"]}
          pcbX="-2.159mm"
          pcbY={0}
          width="1.2999974mm"
          height="1.6999966mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin2"]}
          pcbX="2.159mm"
          pcbY={0}
          width="1.2999974mm"
          height="1.6999966mm"
          shape="rect"
        />
        <silkscreenrect pcbX={0} pcbY={0} width="4.064mm" height="3.048mm" />
        <courtyardrect pcbX={0} pcbY={0} width="6.1134mm" height="3.548mm" />
      </footprint>
    }
    {...props}
  />
)

const sii9022PinLabels = {
  pin1: ["CSCL"],
  pin2: ["CSDA"],
  pin3: ["IOVCC1"],
  pin4: ["D23"],
  pin6: ["D22"],
  pin7: ["D21"],
  pin8: ["D20"],
  pin9: ["D19"],
  pin10: ["D18"],
  pin14: ["D15"],
  pin15: ["D14"],
  pin16: ["D13"],
  pin17: ["D12"],
  pin18: ["D11"],
  pin19: ["D10"],
  pin22: ["IDCK"],
  pin24: ["D7"],
  pin25: ["D6"],
  pin27: ["D5"],
  pin28: ["D4"],
  pin29: ["D3"],
  pin30: ["D2"],
  pin33: ["DE"],
  pin34: ["HSYNC"],
  pin35: ["VSYNC"],
  pin51: ["RESET"],
} as const

const qfnPadPitch = 0.499872
const qfnPadInset = 4.249928
const qfnPadEdge = 4.907534
const pinNumberRange = (first: number, last: number) =>
  Array.from({ length: last - first + 1 }, (_, offset) => first + offset)

export const Sii9022Acnu = (props: ChipProps<typeof sii9022PinLabels>) => (
  <chip
    pinLabels={sii9022PinLabels}
    manufacturerPartNumber="SII9022ACNU"
    supplierPartNumbers={{ jlcpcb: ["C369565"] }}
    footprint={
      <footprint>
        {pinNumberRange(1, 18).map((pinNumber) => (
          <Fragment key={pinNumber}>
            <smtpad
              portHints={[`pin${pinNumber}`]}
              pcbX={-qfnPadInset + (pinNumber - 1) * qfnPadPitch}
              pcbY={-qfnPadEdge}
              width="0.28mm"
              height="0.665mm"
              shape="rect"
            />
          </Fragment>
        ))}
        {pinNumberRange(19, 36).map((pinNumber) => (
          <Fragment key={pinNumber}>
            <smtpad
              portHints={[`pin${pinNumber}`]}
              pcbX={qfnPadEdge}
              pcbY={-qfnPadInset + (pinNumber - 19) * qfnPadPitch}
              width="0.665mm"
              height="0.28mm"
              shape="rect"
            />
          </Fragment>
        ))}
        {pinNumberRange(37, 54).map((pinNumber) => (
          <Fragment key={pinNumber}>
            <smtpad
              portHints={[`pin${pinNumber}`]}
              pcbX={qfnPadInset - (pinNumber - 37) * qfnPadPitch}
              pcbY={qfnPadEdge}
              width="0.28mm"
              height="0.665mm"
              shape="rect"
            />
          </Fragment>
        ))}
        {pinNumberRange(55, 72).map((pinNumber) => (
          <Fragment key={pinNumber}>
            <smtpad
              portHints={[`pin${pinNumber}`]}
              pcbX={-qfnPadEdge}
              pcbY={qfnPadInset - (pinNumber - 55) * qfnPadPitch}
              width="0.665mm"
              height="0.28mm"
              shape="rect"
            />
          </Fragment>
        ))}
        <smtpad
          portHints={["pin73"]}
          pcbX={0}
          pcbY={0}
          width="4.7mm"
          height="4.7mm"
          shape="rect"
        />
        <silkscreenrect pcbX={0} pcbY={0} width="10.15mm" height="10.15mm" />
        <courtyardrect pcbX={0} pcbY={0} width="10.99mm" height="11.35mm" />
      </footprint>
    }
    {...props}
  />
)

const usbCDataPinLabels = {
  pin1: ["USB_DN"],
  pin2: ["USB_DP"],
} as const

export const UsbCDataPort = (props: ChipProps<typeof usbCDataPinLabels>) => (
  <chip
    pinLabels={usbCDataPinLabels}
    footprint={
      <footprint>
        <smtpad
          portHints={["pin1"]}
          pcbX="-0.5mm"
          pcbY={0}
          width="0.3mm"
          height="1.2mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin2"]}
          pcbX="0.5mm"
          pcbY={0}
          width="0.3mm"
          height="1.2mm"
          shape="rect"
        />
        <silkscreenrect pcbX={0} pcbY={0} width="9mm" height="7mm" />
        <silkscreentext text="USB-C" pcbX={0} pcbY="4.2mm" fontSize="1mm" />
        <courtyardrect pcbX={0} pcbY={0} width="10mm" height="8mm" />
      </footprint>
    }
    {...props}
  />
)

// Compatibility alias for the older reset-only repro fixture.
export const Sii9022AcnuReset = Sii9022Acnu

const consoleHeaderPinLabels = {
  pin1: ["UART_RX"],
  pin2: ["UART_TX"],
} as const

export const ConsoleHeader = (
  props: ChipProps<typeof consoleHeaderPinLabels>,
) => (
  <chip
    pinLabels={consoleHeaderPinLabels}
    manufacturerPartNumber="TSW-102-07-G-S"
    footprint={
      <footprint>
        <platedhole
          portHints={["pin1"]}
          pcbX="-1.27mm"
          pcbY={0}
          shape="circle"
          holeDiameter="1mm"
          outerDiameter="1.7mm"
        />
        <platedhole
          portHints={["pin2"]}
          pcbX="1.27mm"
          pcbY={0}
          shape="circle"
          holeDiameter="1mm"
          outerDiameter="1.7mm"
        />
        <silkscreenrect pcbX={0} pcbY={0} width="5.4mm" height="2.6mm" />
        <silkscreentext text="UART" pcbX={0} pcbY="2.2mm" fontSize="0.8mm" />
      </footprint>
    }
    {...props}
  />
)
