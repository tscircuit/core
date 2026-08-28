import type { ChipProps, PinAttributeMap } from "@tscircuit/props"
import { Fragment, type ReactNode } from "react"

const columns = [1, 2, 3, 4, 5, 8, 9, 10, 11, 12] as const
const rows = [
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
] as const

// Micron z42n Rev. D, Figure 8. Values are ordered by columns 1-5, 8-12.
const signals = [
  ["DNU", "DNU", "VSS", "VDD2", "ZQ", "NC", "VDD2", "VSS", "DNU", "DNU"],
  ["DNU", "DQ0", "VDDQ", "DQ7", "VDDQ", "VDDQ", "DQ15", "VDDQ", "DQ8", "DNU"],
  ["VSS", "DQ1", "DMI0", "DQ6", "VSS", "VSS", "DQ14", "DMI1", "DQ9", "VSS"],
  [
    "VDDQ",
    "VSS",
    "DQS0_t",
    "VSS",
    "VDDQ",
    "VDDQ",
    "VSS",
    "DQS1_t",
    "VSS",
    "VDDQ",
  ],
  [
    "VSS",
    "DQ2",
    "DQS0_c",
    "DQ5",
    "VSS",
    "VSS",
    "DQ13",
    "DQS1_c",
    "DQ10",
    "VSS",
  ],
  [
    "VDD1",
    "DQ3",
    "VDDQ",
    "DQ4",
    "VDD2",
    "VDD2",
    "DQ12",
    "VDDQ",
    "DQ11",
    "VDD1",
  ],
  ["VSS", "ODT_CA", "VSS", "VDD1", "VSS", "VSS", "VDD1", "VSS", "NC", "VSS"],
  ["VDD2", "CA0", "NC", "CS", "VDD2", "VDD2", "CA2", "CA3", "CA4", "VDD2"],
  ["VSS", "CA1", "VSS", "CKE", "NC", "CK_t", "CK_c", "VSS", "CA5", "VSS"],
  ["VDD2", "VSS", "VDD2", "VSS", "NC", "NC", "VSS", "VDD2", "VSS", "VDD2"],
  ["VDD2", "VSS", "VDD2", "VSS", "NC", "NC", "VSS", "VDD2", "VSS", "VDD2"],
  ["VSS", "NC", "VSS", "NC", "NC", "NC", "NC", "VSS", "NC", "VSS"],
  ["VDD2", "NC", "NC", "NC", "VDD2", "VDD2", "NC", "NC", "NC", "VDD2"],
  ["VSS", "NC", "VSS", "VDD1", "VSS", "VSS", "VDD1", "VSS", "RESET_n", "VSS"],
  ["VDD1", "NC", "VDDQ", "NC", "VDD2", "VDD2", "NC", "VDDQ", "NC", "VDD1"],
  ["VSS", "NC", "NC", "NC", "VSS", "VSS", "NC", "NC", "NC", "VSS"],
  ["VDDQ", "VSS", "NC", "VSS", "VDDQ", "VDDQ", "VSS", "NC", "VSS", "VDDQ"],
  ["VSS", "NC", "NC", "NC", "VSS", "VSS", "NC", "NC", "NC", "VSS"],
  ["DNU", "NC", "VDDQ", "NC", "VDDQ", "VDDQ", "NC", "VDDQ", "NC", "DNU"],
  ["DNU", "DNU", "VSS", "VDD2", "VSS", "VSS", "VDD2", "VSS", "DNU", "DNU"],
] as const

export const ballMap = rows.flatMap((row, rowIndex) =>
  columns.map((column, columnIndex) => ({
    ball: `${row}${column}`,
    signal: signals[rowIndex]![columnIndex]!,
    x: (column - 6.5) * 0.8,
    // L and M are unpopulated physical rows, but retain their 0.65 mm spacing.
    y: (10.5 - (rowIndex < 10 ? rowIndex : rowIndex + 2)) * 0.65,
  })),
)

const uniqueSignals = new Set(
  ballMap
    .map(({ signal }) => signal)
    .filter(
      (signal) =>
        !["NC", "DNU", "VSS", "VDD1", "VDD2", "VDDQ"].includes(signal),
    ),
)

const pinLabels = Object.fromEntries(
  ballMap.map(({ ball, signal }, index) => [
    `pin${index + 1}`,
    uniqueSignals.has(signal)
      ? [ball, signal, `${signal}_${ball}`]
      : [ball, `${signal}_${ball}`],
  ]),
) as Record<`pin${number}`, readonly string[]>

const pinAttributes = ballMap.reduce<Record<string, PinAttributeMap>>(
  (attributes, { ball, signal }) => {
    if (signal === "DNU") {
      attributes[ball] = {
        doNotConnect: true,
        includeInBoardPinout: false,
      }
    } else if (signal === "NC") {
      attributes[ball] = { includeInBoardPinout: false }
    } else if (signal === "VSS") {
      attributes[ball] = {
        requiresGround: true,
        includeInBoardPinout: false,
      }
    } else if (signal.startsWith("VDD")) {
      attributes[ball] = {
        requiresPower: true,
        requiresVoltage:
          signal === "VDD1" ? "1.8V" : signal === "VDD2" ? "1.1V" : undefined,
        shouldHaveDecouplingCapacitor: true,
        includeInBoardPinout: false,
      }
    }
    return attributes
  },
  {},
)

const makePads = (): ReactNode[] =>
  ballMap.map(({ ball, x, y }, index) => (
    <Fragment key={ball}>
      <smtpad
        portHints={[`pin${index + 1}`, ball]}
        pcbX={`${x}mm`}
        pcbY={`${y}mm`}
        radius="0.2mm"
        shape="circle"
      />
    </Fragment>
  ))

export const MT53E1G16D1ZW = (props: ChipProps<typeof pinLabels>) => (
  <chip
    {...props}
    datasheetUrl="https://docs.rs-online.com/ad5d/A700000015750558.pdf"
    manufacturerPartNumber="MT53E1G16D1ZW-046 WT:C"
    pinLabels={pinLabels}
    pinAttributes={pinAttributes}
    footprint={
      <footprint>
        {makePads()}
        <silkscreenpath
          route={[
            { x: -5, y: -7.25 },
            { x: 5, y: -7.25 },
            { x: 5, y: 7.25 },
            { x: -5, y: 7.25 },
            { x: -5, y: -7.25 },
          ]}
          strokeWidth={0.15}
        />
        <silkscreencircle pcbX="-4.65mm" pcbY="6.9mm" radius="0.18mm" />
      </footprint>
    }
  />
)
