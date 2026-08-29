import type { ChipProps } from "@tscircuit/props"
import { Fragment } from "react"

// The AM62L FCCSP package is a 0.5 mm, 23-by-23 grid with depopulated
// positions. These row masks are copied from the AM62L32BOGHAANBR fixture in
// tscircuit/ti so this regression does not depend on the generated chip package.
const AM62L_ROW_NAMES = [
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

const AM62L_ROW_MASKS = [
  "11111111111111111111111",
  "11111111111111111111111",
  "11010101001110010101011",
  "11110111001010011101111",
  "11000101111111110100011",
  "11111100000000000111111",
  "11010011111111111001011",
  "11111111010101011111111",
  "11000001101010110000011",
  "11000001110101110000011",
  "11111111101010111111111",
  "11101011010101011010111",
  "11111111101010111111111",
  "11000001110101110000011",
  "11000001101010110000011",
  "11111111010101011111111",
  "11010011111111111001011",
  "11111100000000000111111",
  "11000101111111110100011",
  "11110111001010011101111",
  "11010101001110010101011",
  "11111111111111111111111",
  "11111111111111111111111",
] as const

const AM62L_PAD_POSITIONS = (() => {
  let pinNumber = 0
  return AM62L_ROW_MASKS.flatMap((rowMask, rowIndex) =>
    [...rowMask].flatMap((isPopulated, columnIndex) => {
      if (isPopulated !== "1") return []
      pinNumber += 1
      return [
        {
          ballName: `${AM62L_ROW_NAMES[rowIndex]}${columnIndex + 1}`,
          pinNumber,
          x: -5.5 + columnIndex * 0.5,
          y: 5.5 - rowIndex * 0.5,
        },
      ]
    }),
  )
})()

const AM62L_PIN_NUMBER_BY_BALL = new Map(
  AM62L_PAD_POSITIONS.map(({ ballName, pinNumber }) => [ballName, pinNumber]),
)

const AM62L_VSS_BALLS = `
  A1 A2 A4 A10 A13 A16 A19 A22 A23 B1 B5 B17 B20 B23 C12 C18 D1
  E2 E6 E8 E9 E10 E14 E15 F5 F6 F18 G7 G8 G9 G12 G15 G16 G17
  H1 H7 H14 H17 K8 K9 K15 L7 L9 L13 L16 L18 M1 M12 N7 N9 N11
  N13 N16 P9 P15 R1 R8 R13 R15 T2 T7 T8 T19 U7 U8 U10 U13 U14
  U15 U17 U20 V3 V18 V19 W9 W10 W12 W14 W15 W16 W18 Y1 Y20 Y21
  AA4 AA20 AB1 AB7 AB21 AB23 AC1 AC2 AC11 AC14 AC19 AC22 AC23
`
  .trim()
  .split(/\s+/)

const getAm62lPinNumber = (ballName: string): number => {
  const pinNumber = AM62L_PIN_NUMBER_BY_BALL.get(ballName)
  if (pinNumber === undefined) {
    throw new Error(`AM62L fixture does not contain ball ${ballName}`)
  }
  return pinNumber
}

export const SOC_GROUND_PINS = AM62L_VSS_BALLS.map(getAm62lPinNumber)

const AM62L_PIN_LABELS = {
  ...Object.fromEntries(
    AM62L_VSS_BALLS.map((ballName) => [
      `pin${getAm62lPinNumber(ballName)}`,
      [ballName, "VSS"],
    ]),
  ),
  pin76: ["E1", "DDR0_DQ3"],
  pin91: ["F1", "DDR0_DQ2"],
  pin92: ["F2", "DDR0_DM0"],
  pin93: ["F3", "DDR0_DQ1"],
  pin94: ["F4", "DDR0_DQ0"],
  pin103: ["G1", "DDR0_DQS0"],
  pin104: ["G2", "DDR0_DQS0_n"],
  pin105: ["G4", "DDR0_DQ4"],
  pin121: ["H2", "DDR0_DQ6"],
  pin122: ["H3", "DDR0_DQ7"],
  pin123: ["H4", "DDR0_DQ5"],
  pin124: ["H5", "DDR0_A5"],
  pin125: ["H6", "DDR0_A1"],
  pin139: ["J1", "DDR0_A4"],
  pin140: ["J2", "DDR0_RESET0_n"],
  pin149: ["K1", "DDR0_CKE0"],
  pin150: ["K2", "DDR0_A3"],
  pin162: ["L3", "DDR0_CS0_n"],
  pin164: ["L5", "DDR0_A0"],
  pin165: ["L6", "DDR0_A2"],
  pin215: ["P1", "DDR0_CK0"],
  pin216: ["P2", "DDR0_CK0_n"],
  pin236: ["T1", "DDR0_DQ10"],
  pin238: ["T3", "DDR0_DQ9"],
  pin255: ["U1", "DDR0_DQ11"],
  pin256: ["U2", "DDR0_DQ14"],
  pin257: ["U4", "DDR0_DQ12"],
  pin272: ["V1", "DDR0_DQS1"],
  pin273: ["V2", "DDR0_DQS1_n"],
  pin275: ["V4", "DDR0_DQ8"],
  pin276: ["V5", "DDR0_DQ13"],
  pin284: ["W1", "DDR0_DQ15"],
  pin285: ["W2", "DDR0_DM1"],
} as const

export const Am62l32 = (props: ChipProps<typeof AM62L_PIN_LABELS>) => (
  <chip
    {...props}
    pinLabels={AM62L_PIN_LABELS}
    manufacturerPartNumber="AM62L32BOGHAANBR"
    footprint={
      <footprint>
        {AM62L_PAD_POSITIONS.map(({ pinNumber, x, y }) => (
          <Fragment key={`am62l-pad-${pinNumber}`}>
            <smtpad
              portHints={[`pin${pinNumber}`]}
              pcbX={x}
              pcbY={y}
              radius="0.127mm"
              solderMaskMargin="0.0254mm"
              shape="circle"
            />
          </Fragment>
        ))}
        <silkscreenpath
          route={[
            { x: -5.95, y: 5.95 },
            { x: 5.95, y: 5.95 },
            { x: 5.95, y: -5.95 },
            { x: -5.95, y: -5.95 },
            { x: -5.95, y: 5.95 },
          ]}
        />
        <silkscreenpath
          route={[
            { x: -6.3, y: 5.5 },
            { x: -6.3201, y: 5.575 },
            { x: -6.375, y: 5.6299 },
            { x: -6.45, y: 5.65 },
            { x: -6.525, y: 5.6299 },
            { x: -6.5799, y: 5.575 },
            { x: -6.6, y: 5.5 },
            { x: -6.5799, y: 5.425 },
            { x: -6.525, y: 5.3701 },
            { x: -6.45, y: 5.35 },
            { x: -6.375, y: 5.3701 },
            { x: -6.3201, y: 5.425 },
            { x: -6.3, y: 5.5 },
          ]}
        />
        <silkscreentext
          text="{NAME}"
          pcbX="0mm"
          pcbY="6.8mm"
          anchorAlignment="center"
          fontSize="1mm"
        />
        <courtyardoutline
          outline={[
            { x: -6.2, y: 6.2 },
            { x: 6.2, y: 6.2 },
            { x: 6.2, y: -6.2 },
            { x: -6.2, y: -6.2 },
            { x: -6.2, y: 6.2 },
          ]}
        />
      </footprint>
    }
  />
)
