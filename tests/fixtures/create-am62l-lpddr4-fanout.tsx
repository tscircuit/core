import { expect } from "bun:test"
import type { ChipProps } from "@tscircuit/props"
import { orderedRenderPhases } from "lib/components/base-components/Renderable"
import type { Board } from "lib/components/normal-components/Board"
import { createInstanceFromReactElement } from "lib/fiber/create-instance-from-react-element"
import type { GenericLocalAutorouter } from "lib/utils/autorouting/GenericLocalAutorouter"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { getPresetAutoroutingConfig } from "lib/utils/autorouting/getPresetAutoroutingConfig"
import { getViaBoardLayers } from "lib/utils/getViaSpanLayers"
import { Fragment } from "react"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

type DdrBusName =
  | "DDR_BYTE0"
  | "DDR_BYTE1"
  | "DDR_ADDR_CTRL"
  | "DDR_CLOCK"
  | "DDR_DQS0"
  | "DDR_DQS1"
  | "DDR_RESET"
  | "DDR_DMI0"
  | "DDR_DMI1"

interface DdrConnection {
  busName: DdrBusName
  memoryBall: string
  memoryPinNumber: number
  memorySignal: string
  socBall: string
  socPinNumber: number
  socSignal: string
  traceName: string
}

const DDR_PIN_ASSIGNMENTS = [
  [0, 94, "F4", 12, "B2"],
  [1, 93, "F3", 22, "C2"],
  [2, 91, "F1", 42, "E2"],
  [3, 76, "E1", 52, "F2"],
  [4, 105, "G4", 54, "F4"],
  [5, 123, "H4", 44, "E4"],
  [6, 121, "H2", 24, "C4"],
  [7, 122, "H3", 14, "B4"],
  [8, 275, "V4", 19, "B11"],
  [9, 238, "T3", 29, "C11"],
  [10, 236, "T1", 49, "E11"],
  [11, 255, "U1", 59, "F11"],
  [12, 257, "U4", 57, "F9"],
  [13, 276, "V5", 47, "E9"],
  [14, 256, "U2", 27, "C9"],
  [15, 284, "W1", 17, "B9"],
] as const

const DDR_CONNECTIONS: readonly DdrConnection[] = DDR_PIN_ASSIGNMENTS.map(
  ([bit, socPinNumber, socBall, memoryPinNumber, memoryBall]) => ({
    busName: bit < 8 ? "DDR_BYTE0" : "DDR_BYTE1",
    memoryBall,
    memoryPinNumber,
    memorySignal: `DQ${bit}`,
    socBall,
    socPinNumber,
    socSignal: `DDR0_DQ${bit}`,
    traceName: `DQ${bit}`,
  }),
)

const DDR_ADDR_CTRL_PIN_ASSIGNMENTS = [
  ["CA0", "DDR0_A0", 164, "L5", 72, "H2"],
  ["CA1", "DDR0_A1", 125, "H6", 82, "J2"],
  ["CA2", "DDR0_A2", 165, "L6", 77, "H9"],
  ["CA3", "DDR0_A3", 150, "K2", 78, "H10"],
  ["CA4", "DDR0_A4", 139, "J1", 79, "H11"],
  ["CA5", "DDR0_A5", 124, "H5", 89, "J11"],
  ["CS", "DDR0_CS0_n", 162, "L3", 74, "H4"],
  ["CKE", "DDR0_CKE0", 149, "K1", 84, "J4"],
] as const

const DDR_ADDR_CTRL_CONNECTIONS: readonly DdrConnection[] =
  DDR_ADDR_CTRL_PIN_ASSIGNMENTS.map(
    ([
      memorySignal,
      socSignal,
      socPinNumber,
      socBall,
      memoryPinNumber,
      memoryBall,
    ]) => ({
      busName: "DDR_ADDR_CTRL",
      memoryBall,
      memoryPinNumber,
      memorySignal,
      socBall,
      socPinNumber,
      socSignal,
      traceName: memorySignal,
    }),
  )

const DDR_CLOCK_PIN_ASSIGNMENTS = [
  ["CK_t", "DDR0_CK0", 215, "P1", 86, "J8"],
  ["CK_c", "DDR0_CK0_n", 216, "P2", 87, "J9"],
] as const

const DDR_CLOCK_CONNECTIONS: readonly DdrConnection[] =
  DDR_CLOCK_PIN_ASSIGNMENTS.map(
    ([
      memorySignal,
      socSignal,
      socPinNumber,
      socBall,
      memoryPinNumber,
      memoryBall,
    ]) => ({
      busName: "DDR_CLOCK",
      memoryBall,
      memoryPinNumber,
      memorySignal,
      socBall,
      socPinNumber,
      socSignal,
      traceName: memorySignal,
    }),
  )

const DDR_DQS0_PIN_ASSIGNMENTS = [
  ["DQS0_t", "DDR0_DQS0", 103, "G1", 33, "D3"],
  ["DQS0_c", "DDR0_DQS0_n", 104, "G2", 43, "E3"],
] as const

const DDR_DQS0_CONNECTIONS: readonly DdrConnection[] =
  DDR_DQS0_PIN_ASSIGNMENTS.map(
    ([
      memorySignal,
      socSignal,
      socPinNumber,
      socBall,
      memoryPinNumber,
      memoryBall,
    ]) => ({
      busName: "DDR_DQS0",
      memoryBall,
      memoryPinNumber,
      memorySignal,
      socBall,
      socPinNumber,
      socSignal,
      traceName: memorySignal,
    }),
  )

const DDR_DQS1_PIN_ASSIGNMENTS = [
  ["DQS1_t", "DDR0_DQS1", 272, "V1", 38, "D10"],
  ["DQS1_c", "DDR0_DQS1_n", 273, "V2", 48, "E10"],
] as const

const DDR_DQS1_CONNECTIONS: readonly DdrConnection[] =
  DDR_DQS1_PIN_ASSIGNMENTS.map(
    ([
      memorySignal,
      socSignal,
      socPinNumber,
      socBall,
      memoryPinNumber,
      memoryBall,
    ]) => ({
      busName: "DDR_DQS1",
      memoryBall,
      memoryPinNumber,
      memorySignal,
      socBall,
      socPinNumber,
      socSignal,
      traceName: memorySignal,
    }),
  )

const DDR_RESET_CONNECTION = {
  busName: "DDR_RESET",
  memoryBall: "T11",
  memoryPinNumber: 139,
  memorySignal: "RESET_n",
  socBall: "J2",
  socPinNumber: 140,
  socSignal: "DDR0_RESET0_n",
  traceName: "RESET_n",
} as const satisfies DdrConnection

const DDR_DMI0_CONNECTION = {
  busName: "DDR_DMI0",
  memoryBall: "C3",
  memoryPinNumber: 23,
  memorySignal: "DMI0",
  socBall: "F2",
  socPinNumber: 92,
  socSignal: "DDR0_DM0",
  traceName: "DMI0",
} as const satisfies DdrConnection

const DDR_DMI1_CONNECTION = {
  busName: "DDR_DMI1",
  memoryBall: "C10",
  memoryPinNumber: 28,
  memorySignal: "DMI1",
  socBall: "W2",
  socPinNumber: 285,
  socSignal: "DDR0_DM1",
  traceName: "DMI1",
} as const satisfies DdrConnection

const DDR_SIGNAL_CONNECTIONS = [
  ...DDR_CONNECTIONS,
  ...DDR_ADDR_CTRL_CONNECTIONS,
  ...DDR_CLOCK_CONNECTIONS,
  ...DDR_DQS0_CONNECTIONS,
  ...DDR_DQS1_CONNECTIONS,
  DDR_RESET_CONNECTION,
  DDR_DMI0_CONNECTION,
  DDR_DMI1_CONNECTION,
] as const

// The real 373-ball FCCSP footprint is a 0.5 mm grid with depopulated rows.
// Keeping the row masks here makes the regression fixture independent of the
// generated registry package while preserving the package escape geometry.
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

const AM62L_VDD_CORE_BALLS = [
  "J9",
  "J11",
  "J13",
  "J15",
  "K10",
  "K14",
  "L15",
  "M14",
  "N15",
  "P10",
  "P12",
  "P14",
  "R9",
  "R11",
  "M10",
] as const
const AM62L_VDDS_DDR_BALLS = ["L8", "M7", "M8", "N8", "P8"] as const
const AM62L_VDDA_1V8_BALLS = ["G14", "T12", "R16", "N17", "L11", "K12"] as const
const AM62L_SOC_DVDD3V3_BALLS = ["U12", "L17", "J16", "H10", "G10"] as const
const AM62L_SOC_DVDD1V8_BALLS = ["H8", "H16", "M17", "P16", "T14"] as const
const AM62L_VDDA_CORE_BALLS = ["U11", "H12", "G13"] as const
const AM62L_VPP_BALLS = ["N18"] as const
const AM62L_VDD_MMC1_SD_BALLS = ["U16"] as const
const AM62L_VDDSHV_SD_IO_BALLS = ["T10"] as const
const AM62L_SOC_VDD_RTC_BALLS = ["T17"] as const
const AM62L_SOC_VDDS_RTC_1V8_BALLS = ["T18"] as const

const AM62L_SPECIAL_CAP_BALLS = [
  {
    ballName: "J8",
    pinSignal: "CAP_VDDS_MMC0",
    capacitance: "1uF",
    evmReference: "C339",
  },
  {
    ballName: "U9",
    pinSignal: "CAP_VDDS_MMC1",
    capacitance: "1uF",
    evmReference: "C294",
  },
  {
    ballName: "M16",
    pinSignal: "CAP_VDDS_MMC2",
    capacitance: "1uF",
    evmReference: "C310",
  },
  {
    ballName: "K16",
    pinSignal: "CAP_VDDS_GPMC",
    capacitance: "1uF",
    evmReference: "C323",
  },
  {
    ballName: "G11",
    pinSignal: "CAP_VDDS_GENERAL1",
    capacitance: "1uF",
    evmReference: "C338",
  },
  {
    ballName: "T16",
    pinSignal: "CAP_VDDSHV_MMC",
    capacitance: "3.3uF",
    evmReference: "C286",
  },
] as const

const AM62L_DDR_HIGH_SPEED_CAPACITANCE = "1uF"
const AM62L_DDR_MAX_DECOUPLING_DISTANCE = 3.81

// SPRAD06C requires five high-speed VDDS_DDR capacitors totaling at least
// 1.4 uF, with at least three under the processor and every capacitor within
// 150 mil (3.81 mm) of a power/ground ball. The TMDS62LEVM reference design
// uses five high-priority 1 uF parts plus three medium-priority 0.1 uF parts
// under the BGA. Its separate 22 uF bulk capacitor is at the PMIC output and
// is intentionally outside this processor-fanout fixture.
const AM62L_DDR_DECOUPLING_CAPACITORS = [
  {
    capacitance: AM62L_DDR_HIGH_SPEED_CAPACITANCE,
    name: "C_SOC_DDR_HS_L8",
    priority: "high",
    targetBall: "L8",
    pcbX: -0.625,
    pcbY: 0.625,
    pcbRotation: 180,
    vddViaOffset: { x: -0.829, y: 0.311 },
    groundViaOffset: { x: -0.33, y: 0.45 },
  },
  {
    capacitance: AM62L_DDR_HIGH_SPEED_CAPACITANCE,
    name: "C_SOC_DDR_HS_M7",
    priority: "high",
    targetBall: "M7",
    pcbX: -3.125,
    pcbY: -1.75,
    pcbRotation: 180,
    vddViaOffset: { x: 0.239, y: -0.338 },
    groundViaOffset: { x: -0.421, y: -0.338 },
  },
  {
    capacitance: AM62L_DDR_HIGH_SPEED_CAPACITANCE,
    name: "C_SOC_DDR_HS_M8",
    priority: "high",
    targetBall: "M8",
    pcbX: -1,
    pcbY: -0.125,
    pcbRotation: 180,
    vddViaOffset: { x: 0.78, y: 0 },
    groundViaOffset: { x: -0.78, y: 0 },
  },
  {
    capacitance: AM62L_DDR_HIGH_SPEED_CAPACITANCE,
    name: "C_SOC_DDR_HS_N8",
    priority: "high",
    targetBall: "N8",
    pcbX: -0.75,
    pcbY: -1.175,
    pcbRotation: 180,
    vddViaOffset: { x: 0.239, y: 0.338 },
    groundViaOffset: { x: -0.421, y: -0.338 },
  },
  {
    capacitance: AM62L_DDR_HIGH_SPEED_CAPACITANCE,
    name: "C_SOC_DDR_HS_P8",
    priority: "high",
    targetBall: "P8",
    pcbX: -1.75,
    pcbY: -2.25,
    pcbRotation: 90,
    vddViaOffset: { x: 0.446, y: -0.435 },
    groundViaOffset: { x: -0.98, y: 0 },
  },
  {
    capacitance: "0.1uF",
    name: "C_SOC_DDR_MED1",
    priority: "medium",
    targetBall: "P8",
    pcbX: -0.625,
    pcbY: -2,
    pcbRotation: 180,
    vddViaOffset: { x: 0.765, y: 0.116 },
    groundViaOffset: { x: -0.555, y: -0.39 },
  },
  {
    capacitance: "0.1uF",
    name: "C_SOC_DDR_MED2",
    priority: "medium",
    targetBall: "P8",
    pcbX: -0.75,
    pcbY: -3.125,
    pcbRotation: 90,
    vddViaOffset: { x: 0.33, y: -0.45 },
    groundViaOffset: { x: -0.105, y: 0.39 },
  },
  {
    capacitance: "0.1uF",
    name: "C_SOC_DDR_MED3",
    priority: "medium",
    targetBall: "P8",
    pcbX: 0.75,
    pcbY: -1.25,
    pcbRotation: 180,
    vddViaOffset: { x: 0.239, y: -0.338 },
    groundViaOffset: { x: -0.239, y: 0.338 },
  },
] as const

type Am62lDecouplingPlacement = "under" | "perimeter"

interface UnplacedAm62lDecouplingCapacitor {
  capacitance: string
  evmReference: string
  footprint: "cap0201_nosilkscreen" | "cap0402_nosilkscreen"
  name: string
  placement: Am62lDecouplingPlacement
  priority: "high" | "medium" | "low" | "bulk" | "required"
  railNetName: string
  targetBall: string
}

const createEvmRailCapacitors = ({
  ballNames,
  capacitors,
  railName,
}: {
  ballNames: readonly string[]
  capacitors: readonly {
    capacitance: string
    evmReference: string
    placement: Am62lDecouplingPlacement
    priority: UnplacedAm62lDecouplingCapacitor["priority"]
  }[]
  railName: string
}): UnplacedAm62lDecouplingCapacitor[] =>
  capacitors.map((capacitor, capacitorIndex) => ({
    ...capacitor,
    footprint:
      capacitor.capacitance === "10uF" ||
      capacitor.capacitance === "4.7uF" ||
      capacitor.capacitance === "2.2uF"
        ? "cap0402_nosilkscreen"
        : "cap0201_nosilkscreen",
    name: `C_SOC_${railName}_${capacitor.evmReference}`,
    railNetName: railName,
    targetBall: ballNames[capacitorIndex % ballNames.length]!,
  }))

const underCapacitors = (
  capacitance: string,
  priority: UnplacedAm62lDecouplingCapacitor["priority"],
  evmReferences: readonly string[],
) =>
  evmReferences.map((evmReference) => ({
    capacitance,
    evmReference,
    placement: "under" as const,
    priority,
  }))

const perimeterCapacitors = (
  capacitance: string,
  evmReferences: readonly string[],
) =>
  evmReferences.map((evmReference) => ({
    capacitance,
    evmReference,
    placement: "perimeter" as const,
    priority: "bulk" as const,
  }))

// The inventory matches TMDS62LEVM schematic sheets 18-19. These are the 60
// fitted processor capacitors not already represented by the eight VDDS_DDR
// capacitors above. Required/high/medium parts remain under or near the BGA;
// low-priority C98 uses a perimeter site to preserve clearance. C102 is DNI.
const AM62L_UNPLACED_DIRECT_DECOUPLING_CAPACITORS = [
  ...createEvmRailCapacitors({
    railName: "VDD_CORE",
    ballNames: AM62L_VDD_CORE_BALLS,
    capacitors: [
      ...underCapacitors("1uF", "high", [
        "U19",
        "U43",
        "U40",
        "U38",
        "U41",
        "U24",
        "U20",
      ]),
      ...underCapacitors("1uF", "medium", [
        "C324",
        "C312",
        "C376",
        "C316",
        "C322",
      ]),
      ...underCapacitors("0.1uF", "medium", ["C304", "C306", "C317", "C332"]),
      ...perimeterCapacitors("10uF", ["C108", "C107"]),
      ...perimeterCapacitors("2.2uF", ["C377"]),
      ...perimeterCapacitors("4.7uF", ["C268"]),
    ],
  }),
  ...createEvmRailCapacitors({
    railName: "VDDA_CORE",
    ballNames: AM62L_VDDA_CORE_BALLS,
    capacitors: [
      ...underCapacitors("0.1uF", "medium", ["C291", "C335", "C337"]),
      ...perimeterCapacitors("4.7uF", ["C275"]),
    ],
  }),
  ...createEvmRailCapacitors({
    railName: "VDDA_1V8",
    ballNames: AM62L_VDDA_1V8_BALLS,
    capacitors: [
      ...underCapacitors("0.1uF", "high", ["C318"]),
      ...underCapacitors("1uF", "medium", [
        "C298",
        "C391",
        "C397",
        "C348",
        "C109",
      ]),
      ...underCapacitors("0.01uF", "medium", ["C297"]),
      ...perimeterCapacitors("10uF", ["C111"]),
      ...perimeterCapacitors("1uF", ["C311"]),
    ],
  }),
  ...createEvmRailCapacitors({
    railName: "SOC_DVDD1V8",
    ballNames: AM62L_SOC_DVDD1V8_BALLS,
    capacitors: [
      ...underCapacitors("1uF", "high", ["C341", "C320", "C340", "C295"]),
      ...underCapacitors("1uF", "low", ["C103"]),
      ...perimeterCapacitors("10uF", ["C95"]),
      ...perimeterCapacitors("1uF", ["C314"]),
    ],
  }),
  ...createEvmRailCapacitors({
    railName: "SOC_DVDD3V3",
    ballNames: AM62L_SOC_DVDD3V3_BALLS,
    capacitors: [
      ...underCapacitors("1uF", "high", ["C394", "C395", "C290"]),
      ...underCapacitors("1uF", "medium", ["C402", "C349"]),
      ...perimeterCapacitors("10uF", ["C408"]),
      ...perimeterCapacitors("1uF", ["C334"]),
    ],
  }),
  ...createEvmRailCapacitors({
    railName: "VPP_1V8",
    ballNames: AM62L_VPP_BALLS,
    capacitors: [
      {
        capacitance: "1uF",
        evmReference: "C98",
        placement: "perimeter",
        priority: "low",
      },
      ...perimeterCapacitors("1uF", ["C99"]),
      ...perimeterCapacitors("0.1uF", ["C104"]),
    ],
  }),
  ...createEvmRailCapacitors({
    railName: "VDD_MMC1_SD",
    ballNames: AM62L_VDD_MMC1_SD_BALLS,
    capacitors: underCapacitors("0.1uF", "low", ["C289"]),
  }),
  ...createEvmRailCapacitors({
    railName: "VDDSHV_SD_IO",
    ballNames: AM62L_VDDSHV_SD_IO_BALLS,
    capacitors: underCapacitors("0.1uF", "low", ["C301"]),
  }),
  ...createEvmRailCapacitors({
    railName: "SOC_VDD_RTC",
    ballNames: AM62L_SOC_VDD_RTC_BALLS,
    capacitors: underCapacitors("1uF", "low", ["C300"]),
  }),
  ...createEvmRailCapacitors({
    railName: "SOC_VDDS_RTC_1V8",
    ballNames: AM62L_SOC_VDDS_RTC_1V8_BALLS,
    capacitors: underCapacitors("1uF", "low", ["C292"]),
  }),
  ...AM62L_SPECIAL_CAP_BALLS.map(
    ({ ballName, capacitance, evmReference, pinSignal }) => ({
      capacitance,
      evmReference,
      footprint: "cap0201_nosilkscreen" as const,
      name: `C_SOC_${pinSignal}_${evmReference}`,
      placement: "under" as const,
      priority: "required" as const,
      railNetName: pinSignal,
      targetBall: ballName,
    }),
  ),
] as const satisfies readonly UnplacedAm62lDecouplingCapacitor[]

const getCapCourtyardSize = (
  footprint: UnplacedAm62lDecouplingCapacitor["footprint"],
  pcbRotation: number,
) => {
  // The regression only needs the SMT pad envelope for overlap checks.
  // A separate assembly courtyard would unnecessarily exclude legal bottom-side
  // placements beneath the BGA.
  const unrotated =
    footprint === "cap0402_nosilkscreen"
      ? { width: 1.56, height: 0.64 }
      : { width: 1.12, height: 0.4 }
  return Math.abs(pcbRotation % 180) === 90
    ? { width: unrotated.height, height: unrotated.width }
    : unrotated
}

const rotateLocalPoint = (
  point: { x: number; y: number },
  pcbRotation: number,
) => {
  const angle = (pcbRotation * Math.PI) / 180
  return {
    x: point.x * Math.cos(angle) - point.y * Math.sin(angle),
    y: point.x * Math.sin(angle) + point.y * Math.cos(angle),
  }
}

// These deterministic sites were selected against the completed DDR fanout.
// Each entry has one short bottom-layer leg to a local power-net handoff via
// and one to GND. Multiple entry orientations preserve the board's configured
// DRC clearances while keeping every site within 3.81 mm of its rail's BGA
// balls. The six CAP_* rails each have a single, exact target ball.
const AM62L_UNDER_DECOUPLING_PLACEMENTS = [
  {
    railNetName: "CAP_VDDS_MMC0",
    pcbX: -3.5,
    pcbY: 4.7,
    pcbRotation: 0,
    groundViaOffset: { x: -0.8, y: 0 },
    powerViaOffset: { x: 0.8, y: 0 },
  },
  {
    railNetName: "VDD_CORE",
    pcbX: 2.3,
    pcbY: -0.2,
    pcbRotation: 0,
    groundViaOffset: { x: -0.8, y: 0.2 },
    powerViaOffset: { x: 0.8, y: 0.2 },
  },
  {
    railNetName: "VDD_CORE",
    pcbX: 1.2,
    pcbY: -4.7,
    pcbRotation: 180,
    groundViaOffset: { x: -0.15, y: -0.45 },
    powerViaOffset: { x: 0.15, y: -0.45 },
  },
  {
    railNetName: "VDD_CORE",
    pcbX: 1.1,
    pcbY: 0.2,
    pcbRotation: 180,
    groundViaOffset: { x: -0.15, y: 0.45 },
    powerViaOffset: { x: 0.15, y: -0.45 },
  },
  {
    railNetName: "VDD_CORE",
    pcbX: 4.5,
    pcbY: 2.5,
    pcbRotation: 90,
    groundViaOffset: { x: -0.8, y: -0.2 },
    powerViaOffset: { x: 0.8, y: 0.2 },
  },
  {
    railNetName: "VDD_CORE",
    pcbX: 2.1,
    pcbY: 3.7,
    pcbRotation: 0,
    groundViaOffset: { x: -0.35, y: -0.45 },
    powerViaOffset: { x: 0.35, y: -0.45 },
  },
  {
    railNetName: "VDD_CORE",
    pcbX: 3.8,
    pcbY: -1.8,
    pcbRotation: 0,
    groundViaOffset: { x: -0.8, y: 0.2 },
    powerViaOffset: { x: 0.8, y: 0.2 },
  },
  {
    railNetName: "VDD_CORE",
    pcbX: 3.1,
    pcbY: 4.2,
    pcbRotation: 180,
    groundViaOffset: { x: -0.35, y: 0.45 },
    powerViaOffset: { x: 0.35, y: 0.45 },
  },
  {
    railNetName: "VDD_CORE",
    pcbX: 0,
    pcbY: -4.5,
    pcbRotation: 0,
    groundViaOffset: { x: -0.8, y: -0.2 },
    powerViaOffset: { x: 0.8, y: -0.2 },
  },
  {
    railNetName: "VDD_CORE",
    pcbX: 3.3,
    pcbY: 3.1,
    pcbRotation: 270,
    groundViaOffset: { x: -0.35, y: 0.45 },
    powerViaOffset: { x: 0.35, y: 0.45 },
  },
  {
    railNetName: "VDD_CORE",
    pcbX: 1.1,
    pcbY: -2.3,
    pcbRotation: 0,
    groundViaOffset: { x: -0.51, y: 0.45 },
    powerViaOffset: { x: 0.51, y: 0.45 },
  },
  {
    railNetName: "VDD_CORE",
    pcbX: 2.2,
    pcbY: -1.9,
    pcbRotation: 270,
    groundViaOffset: { x: -0.35, y: 0.45 },
    powerViaOffset: { x: 0.35, y: -0.45 },
  },
  {
    railNetName: "VDD_CORE",
    pcbX: 3.8,
    pcbY: 3.1,
    pcbRotation: 270,
    groundViaOffset: { x: -0.35, y: -0.45 },
    powerViaOffset: { x: 0.35, y: 0.45 },
  },
  {
    railNetName: "VDD_CORE",
    pcbX: 3.2,
    pcbY: -0.8,
    pcbRotation: 0,
    groundViaOffset: { x: -0.8, y: -0.2 },
    powerViaOffset: { x: 0.8, y: -0.2 },
  },
  {
    railNetName: "VDD_CORE",
    pcbX: -2.6,
    pcbY: 4.2,
    pcbRotation: 0,
    groundViaOffset: { x: -0.15, y: -0.45 },
    powerViaOffset: { x: 0.2, y: 0.45 },
  },
  {
    railNetName: "VDD_CORE",
    pcbX: 2.6,
    pcbY: -4.3,
    pcbRotation: 0,
    groundViaOffset: { x: -0.35, y: -0.45 },
    powerViaOffset: { x: 0.8, y: 0 },
  },
  {
    railNetName: "VDD_CORE",
    pcbX: -4.2,
    pcbY: 3.9,
    pcbRotation: 0,
    groundViaOffset: { x: -0.15, y: 0.45 },
    powerViaOffset: { x: 0.2, y: -0.45 },
  },
  {
    railNetName: "CAP_VDDS_GENERAL1",
    pcbX: 0.4,
    pcbY: 6.2,
    pcbRotation: 180,
    groundViaOffset: { x: -0.51, y: -0.45 },
    powerViaOffset: { x: 0.51, y: -0.45 },
  },
  {
    railNetName: "VDDA_1V8",
    pcbX: 5,
    pcbY: -2.5,
    pcbRotation: 90,
    groundViaOffset: { x: -0.15, y: 0.45 },
    powerViaOffset: { x: 0.15, y: 0.45 },
  },
  {
    railNetName: "VDDA_1V8",
    pcbX: 5.4,
    pcbY: 1.3,
    pcbRotation: 90,
    groundViaOffset: { x: -0.51, y: -0.45 },
    powerViaOffset: { x: 0.51, y: -0.45 },
  },
  {
    railNetName: "VDDA_1V8",
    pcbX: -1.4,
    pcbY: -4.7,
    pcbRotation: 180,
    groundViaOffset: { x: -0.35, y: -0.45 },
    powerViaOffset: { x: 0.35, y: -0.45 },
  },
  {
    railNetName: "VDDA_1V8",
    pcbX: 4.4,
    pcbY: 4.1,
    pcbRotation: 180,
    groundViaOffset: { x: -0.15, y: 0.45 },
    powerViaOffset: { x: 0.15, y: 0.45 },
  },
  {
    railNetName: "VDDA_1V8",
    pcbX: -0.3,
    pcbY: -5.6,
    pcbRotation: 90,
    groundViaOffset: { x: -0.35, y: -0.45 },
    powerViaOffset: { x: 0.35, y: 0.45 },
  },
  {
    railNetName: "VDDA_1V8",
    pcbX: 0,
    pcbY: 1.7,
    pcbRotation: 0,
    groundViaOffset: { x: -0.8, y: 0 },
    powerViaOffset: { x: 0.8, y: 0 },
  },
  {
    railNetName: "VDDA_1V8",
    pcbX: 1.9,
    pcbY: 6.2,
    pcbRotation: 180,
    groundViaOffset: { x: -0.51, y: -0.45 },
    powerViaOffset: { x: 0.51, y: -0.45 },
  },
  {
    railNetName: "VDDSHV_SD_IO",
    pcbX: -3.2,
    pcbY: -5.1,
    pcbRotation: 270,
    groundViaOffset: { x: -0.35, y: 0.45 },
    powerViaOffset: { x: 0.8, y: 0 },
  },
  {
    railNetName: "SOC_DVDD1V8",
    pcbX: 5.5,
    pcbY: 3.5,
    pcbRotation: 180,
    groundViaOffset: { x: -0.8, y: -0.2 },
    powerViaOffset: { x: 0.8, y: 0.2 },
  },
  {
    railNetName: "SOC_DVDD1V8",
    pcbX: 1.7,
    pcbY: -5.6,
    pcbRotation: 90,
    groundViaOffset: { x: -0.8, y: 0 },
    powerViaOffset: { x: 0.35, y: 0.45 },
  },
  {
    railNetName: "SOC_DVDD1V8",
    pcbX: 5.6,
    pcbY: 2.3,
    pcbRotation: 180,
    groundViaOffset: { x: -0.35, y: -0.45 },
    powerViaOffset: { x: 0.35, y: -0.45 },
  },
  {
    railNetName: "SOC_DVDD1V8",
    pcbX: 5.6,
    pcbY: 2.8,
    pcbRotation: 180,
    groundViaOffset: { x: -0.35, y: -0.45 },
    powerViaOffset: { x: 0.35, y: -0.45 },
  },
  {
    railNetName: "SOC_DVDD1V8",
    pcbX: 1.2,
    pcbY: -5.6,
    pcbRotation: 90,
    groundViaOffset: { x: -0.35, y: -0.45 },
    powerViaOffset: { x: 0.35, y: 0.45 },
  },
  {
    railNetName: "SOC_DVDD3V3",
    pcbX: -1.4,
    pcbY: 5.1,
    pcbRotation: 180,
    groundViaOffset: { x: -0.15, y: 0.45 },
    powerViaOffset: { x: 0.15, y: 0.45 },
  },
  {
    railNetName: "SOC_DVDD3V3",
    pcbX: -1.8,
    pcbY: -5.6,
    pcbRotation: 270,
    groundViaOffset: { x: -0.35, y: -0.45 },
    powerViaOffset: { x: 0.8, y: 0 },
  },
  {
    railNetName: "SOC_DVDD3V3",
    pcbX: -0.9,
    pcbY: 6.2,
    pcbRotation: 180,
    groundViaOffset: { x: -0.15, y: -0.45 },
    powerViaOffset: { x: 0.15, y: -0.45 },
  },
  {
    railNetName: "SOC_DVDD3V3",
    pcbX: -2.3,
    pcbY: 6,
    pcbRotation: 180,
    groundViaOffset: { x: -0.51, y: -0.45 },
    powerViaOffset: { x: 0.51, y: -0.45 },
  },
  {
    railNetName: "SOC_DVDD3V3",
    pcbX: 6.2,
    pcbY: 0.9,
    pcbRotation: 90,
    groundViaOffset: { x: -0.8, y: 0 },
    powerViaOffset: { x: 0.8, y: 0 },
  },
  {
    railNetName: "VDDA_CORE",
    pcbX: 0.2,
    pcbY: -6.2,
    pcbRotation: 270,
    groundViaOffset: { x: -0.35, y: -0.45 },
    powerViaOffset: { x: 0.8, y: 0 },
  },
  {
    railNetName: "VDDA_CORE",
    pcbX: -1.3,
    pcbY: -6.2,
    pcbRotation: 90,
    groundViaOffset: { x: -0.15, y: -0.45 },
    powerViaOffset: { x: 0.15, y: -0.45 },
  },
  {
    railNetName: "VDDA_CORE",
    pcbX: -0.6,
    pcbY: 4.2,
    pcbRotation: 180,
    groundViaOffset: { x: -0.35, y: 0.45 },
    powerViaOffset: { x: 0.35, y: -0.45 },
  },
  {
    railNetName: "CAP_VDDS_MMC2",
    pcbX: 3.2,
    pcbY: -1.3,
    pcbRotation: 0,
    groundViaOffset: { x: -0.35, y: 0.45 },
    powerViaOffset: { x: 0.8, y: 0 },
  },
  {
    railNetName: "SOC_VDDS_RTC_1V8",
    pcbX: 6.1,
    pcbY: -4,
    pcbRotation: 270,
    groundViaOffset: { x: -0.35, y: 0.45 },
    powerViaOffset: { x: 0.35, y: 0.45 },
  },
  {
    railNetName: "SOC_VDD_RTC",
    pcbX: 3.7,
    pcbY: -5.6,
    pcbRotation: 90,
    groundViaOffset: { x: -0.8, y: 0 },
    powerViaOffset: { x: 0.35, y: 0.45 },
  },
  {
    railNetName: "CAP_VDDSHV_MMC",
    pcbX: 2.7,
    pcbY: -5.6,
    pcbRotation: 270,
    groundViaOffset: { x: -0.35, y: -0.45 },
    powerViaOffset: { x: 0.35, y: -0.45 },
  },
  {
    railNetName: "CAP_VDDS_GPMC",
    pcbX: 2.8,
    pcbY: -2.2,
    pcbRotation: 270,
    groundViaOffset: { x: -0.51, y: -0.45 },
    powerViaOffset: { x: 0.51, y: 0.45 },
  },
  {
    railNetName: "CAP_VDDS_MMC1",
    pcbX: -2.3,
    pcbY: -6.1,
    pcbRotation: 270,
    groundViaOffset: { x: -0.35, y: -0.45 },
    powerViaOffset: { x: 0.35, y: -0.45 },
  },
  {
    railNetName: "VDD_MMC1_SD",
    pcbX: 4.6,
    pcbY: -4.8,
    pcbRotation: 0,
    groundViaOffset: { x: -0.15, y: 0.45 },
    powerViaOffset: { x: 0.15, y: -0.45 },
  },
] as const

const AM62L_PERIMETER_CAP_SLOTS = [
  { pcbX: -8, pcbY: -5.4, pcbRotation: 0 },
  { pcbX: -8, pcbY: -1.8, pcbRotation: 0 },
  { pcbX: -8, pcbY: 1.8, pcbRotation: 0 },
  { pcbX: -8, pcbY: 5.4, pcbRotation: 0 },
  { pcbX: -5.2, pcbY: 8, pcbRotation: 270 },
  { pcbX: -2.6, pcbY: 8, pcbRotation: 270 },
  { pcbX: 0, pcbY: 8, pcbRotation: 270 },
  { pcbX: 2.6, pcbY: 8, pcbRotation: 270 },
  { pcbX: 5.2, pcbY: 8, pcbRotation: 270 },
  { pcbX: -3.9, pcbY: -8, pcbRotation: 90 },
  { pcbX: -1.3, pcbY: -8, pcbRotation: 90 },
  { pcbX: 1.3, pcbY: -8, pcbRotation: 90 },
  { pcbX: 3.9, pcbY: -8, pcbRotation: 90 },
  { pcbX: -8, pcbY: 0, pcbRotation: 0 },
] as const

const getPerimeterViaOffsets = (
  footprint: UnplacedAm62lDecouplingCapacitor["footprint"],
) =>
  footprint === "cap0402_nosilkscreen"
    ? {
        groundViaOffset: { x: -0.51, y: 0.57 },
        powerViaOffset: { x: 0.51, y: 0.57 },
      }
    : {
        groundViaOffset: { x: -0.33, y: 0.45 },
        powerViaOffset: { x: 0.33, y: 0.45 },
      }

interface PlacedAm62lDecouplingCapacitor
  extends UnplacedAm62lDecouplingCapacitor {
  groundViaOffset: { x: number; y: number }
  maxDecouplingTraceLength: number
  pcbRotation: number
  pcbX: number
  pcbY: number
  powerViaOffset: { x: number; y: number }
}

const AM62L_DIRECT_DECOUPLING_CAPACITORS: PlacedAm62lDecouplingCapacitor[] =
  AM62L_UNPLACED_DIRECT_DECOUPLING_CAPACITORS.map((capacitor, index, all) => {
    const earlierCapacitors = all.slice(0, index)
    const placement =
      capacitor.placement === "under"
        ? AM62L_UNDER_DECOUPLING_PLACEMENTS.filter(
            (candidate) => candidate.railNetName === capacitor.railNetName,
          )[
            earlierCapacitors.filter(
              (candidate) =>
                candidate.placement === "under" &&
                candidate.railNetName === capacitor.railNetName,
            ).length
          ]
        : AM62L_PERIMETER_CAP_SLOTS[
            earlierCapacitors.filter(
              (candidate) => candidate.placement === "perimeter",
            ).length
          ]
    if (!placement) {
      throw new Error(`Missing decoupling placement for ${capacitor.name}`)
    }
    const viaOffsets =
      capacitor.placement === "under"
        ? {
            groundViaOffset: (
              placement as (typeof AM62L_UNDER_DECOUPLING_PLACEMENTS)[number]
            ).groundViaOffset,
            powerViaOffset: (
              placement as (typeof AM62L_UNDER_DECOUPLING_PLACEMENTS)[number]
            ).powerViaOffset,
          }
        : getPerimeterViaOffsets(capacitor.footprint)
    return {
      ...capacitor,
      ...placement,
      ...viaOffsets,
      maxDecouplingTraceLength:
        capacitor.placement === "under"
          ? AM62L_DDR_MAX_DECOUPLING_DISTANCE
          : 15,
    }
  })

const AM62L_ALL_DECOUPLING_CAPACITORS = [
  ...AM62L_DDR_DECOUPLING_CAPACITORS.map((capacitor) => ({
    ...capacitor,
    footprint: "cap0201_nosilkscreen" as const,
    maxDecouplingTraceLength: AM62L_DDR_MAX_DECOUPLING_DISTANCE,
    placement: "under" as const,
    railNetName: "VDD_LPDDR4",
  })),
  ...AM62L_DIRECT_DECOUPLING_CAPACITORS,
] as const

const getDirectDecouplingViaPosition = (
  capacitor: (typeof AM62L_DIRECT_DECOUPLING_CAPACITORS)[number],
  viaOffset: { x: number; y: number },
) => {
  const rotatedOffset = rotateLocalPoint(viaOffset, capacitor.pcbRotation)
  return {
    x: SOC_PCB_X + capacitor.pcbX + rotatedOffset.x,
    y: SOC_PCB_Y + capacitor.pcbY + rotatedOffset.y,
  }
}
const parseBallList = (ballNames: string): readonly string[] =>
  ballNames.trim().split(/\s+/)

const AM62L_VSS_BALLS = parseBallList(`
  A1 A2 A4 A10 A13 A16 A19 A22 A23 B1 B5 B17 B20 B23 C12 C18 D1
  E2 E6 E8 E9 E10 E14 E15 F5 F6 F18 G7 G8 G9 G12 G15 G16 G17
  H1 H7 H14 H17 K8 K9 K15 L7 L9 L13 L16 L18 M1 M12 N7 N9 N11
  N13 N16 P9 P15 R1 R8 R13 R15 T2 T7 T8 T19 U7 U8 U10 U13 U14
  U15 U17 U20 V3 V18 V19 W9 W10 W12 W14 W15 W16 W18 Y1 Y20 Y21
  AA4 AA20 AB1 AB7 AB21 AB23 AC1 AC2 AC11 AC14 AC19 AC22 AC23
`)

const getRequiredPinNumber = (
  pinNumberByBall: ReadonlyMap<string, number>,
  ballName: string,
  packageName: string,
): number => {
  const pinNumber = pinNumberByBall.get(ballName)
  if (pinNumber === undefined) {
    throw new Error(`${packageName} does not contain ball ${ballName}`)
  }
  return pinNumber
}

const createAm62lPowerBallAssignments = (
  railNetName: string,
  pinSignal: string,
  ballNames: readonly string[],
) =>
  ballNames.map((ballName) => ({
    ballName,
    pinNumber: getRequiredPinNumber(
      AM62L_PIN_NUMBER_BY_BALL,
      ballName,
      "AM62L",
    ),
    pinSignal,
    railNetName,
  }))

const AM62L_POWER_BALLS = [
  ...createAm62lPowerBallAssignments("GND", "VSS", AM62L_VSS_BALLS),
  ...createAm62lPowerBallAssignments(
    "VDD_CORE",
    "VDD_CORE",
    AM62L_VDD_CORE_BALLS.slice(0, -1),
  ),
  ...createAm62lPowerBallAssignments("VDD_CORE", "VDDA_DDR_PLL0", ["M10"]),
  ...createAm62lPowerBallAssignments(
    "VDD_LPDDR4",
    "VDDS_DDR",
    AM62L_VDDS_DDR_BALLS,
  ),
  ...createAm62lPowerBallAssignments("VDDA_1V8", "VDDA_1P8_DSI", ["G14"]),
  ...createAm62lPowerBallAssignments("VDDA_1V8", "VDDA_1P8_USB", ["T12"]),
  ...createAm62lPowerBallAssignments("VDDA_1V8", "VDDS_OSC0", ["R16"]),
  ...createAm62lPowerBallAssignments("VDDA_1V8", "VDDA_ADC", ["N17"]),
  ...createAm62lPowerBallAssignments("VDDA_1V8", "VDDA_PLL0", ["L11"]),
  ...createAm62lPowerBallAssignments("VDDA_1V8", "VDDA_PLL1", ["K12"]),
  ...createAm62lPowerBallAssignments("SOC_DVDD3V3", "VDDA_3P3_USB", ["U12"]),
  ...createAm62lPowerBallAssignments("SOC_DVDD3V3", "VDDSHV0", ["J16", "L17"]),
  ...createAm62lPowerBallAssignments("SOC_DVDD3V3", "VDDSHV1", ["G10", "H10"]),
  ...createAm62lPowerBallAssignments("SOC_DVDD1V8", "VDDSHV2", ["H8"]),
  ...createAm62lPowerBallAssignments("SOC_DVDD1V8", "VDDSHV4", ["M17"]),
  ...createAm62lPowerBallAssignments("SOC_DVDD1V8", "VDDS0", ["T14"]),
  ...createAm62lPowerBallAssignments("SOC_DVDD1V8", "VDDS1", ["H16"]),
  ...createAm62lPowerBallAssignments("SOC_DVDD1V8", "VDDS_WKUP", ["P16"]),
  ...createAm62lPowerBallAssignments("VDDA_CORE", "VDDA_CORE_USB", ["U11"]),
  ...createAm62lPowerBallAssignments("VDDA_CORE", "VDDA_CORE_DSI_CLK", ["H12"]),
  ...createAm62lPowerBallAssignments("VDDA_CORE", "VDDA_CORE_DSI", ["G13"]),
  ...createAm62lPowerBallAssignments("VPP_1V8", "VPP", AM62L_VPP_BALLS),
  ...createAm62lPowerBallAssignments(
    "VDD_MMC1_SD",
    "VDDA_3P3_SDIO",
    AM62L_VDD_MMC1_SD_BALLS,
  ),
  ...createAm62lPowerBallAssignments(
    "VDDSHV_SD_IO",
    "VDDSHV3",
    AM62L_VDDSHV_SD_IO_BALLS,
  ),
  ...createAm62lPowerBallAssignments(
    "SOC_VDD_RTC",
    "VDD_RTC",
    AM62L_SOC_VDD_RTC_BALLS,
  ),
  ...createAm62lPowerBallAssignments(
    "SOC_VDDS_RTC_1V8",
    "VDDS_RTC",
    AM62L_SOC_VDDS_RTC_1V8_BALLS,
  ),
  ...AM62L_SPECIAL_CAP_BALLS.flatMap(({ ballName, pinSignal }) =>
    createAm62lPowerBallAssignments(pinSignal, pinSignal, [ballName]),
  ),
]

const AM62L_DIRECT_POWER_BALLS = AM62L_POWER_BALLS.filter(
  ({ railNetName }) => railNetName !== "GND" && railNetName !== "VDD_LPDDR4",
)
const AM62L_DIRECT_RAIL_NET_NAMES = [
  ...new Set(AM62L_DIRECT_POWER_BALLS.map(({ railNetName }) => railNetName)),
]

const AM62L_PIN_LABELS = {
  ...Object.fromEntries(
    AM62L_POWER_BALLS.map(({ ballName, pinNumber, pinSignal }) => [
      `pin${pinNumber}`,
      [ballName, pinSignal],
    ]),
  ),
  ...Object.fromEntries(
    [
      ...DDR_ADDR_CTRL_CONNECTIONS,
      ...DDR_CLOCK_CONNECTIONS,
      ...DDR_DQS0_CONNECTIONS,
      ...DDR_DQS1_CONNECTIONS,
      DDR_RESET_CONNECTION,
      DDR_DMI0_CONNECTION,
      DDR_DMI1_CONNECTION,
    ].map(({ socBall, socPinNumber, socSignal }) => [
      `pin${socPinNumber}`,
      [socBall, socSignal],
    ]),
  ),
  pin76: ["E1", "DDR0_DQ3"],
  pin91: ["F1", "DDR0_DQ2"],
  pin93: ["F3", "DDR0_DQ1"],
  pin94: ["F4", "DDR0_DQ0"],
  pin105: ["G4", "DDR0_DQ4"],
  pin121: ["H2", "DDR0_DQ6"],
  pin122: ["H3", "DDR0_DQ7"],
  pin123: ["H4", "DDR0_DQ5"],
  pin236: ["T1", "DDR0_DQ10"],
  pin238: ["T3", "DDR0_DQ9"],
  pin255: ["U1", "DDR0_DQ11"],
  pin256: ["U2", "DDR0_DQ14"],
  pin257: ["U4", "DDR0_DQ12"],
  pin275: ["V4", "DDR0_DQ8"],
  pin276: ["V5", "DDR0_DQ13"],
  pin284: ["W1", "DDR0_DQ15"],
} as const

const AM62L_DECOUPLING_CAPACITOR_BY_TARGET_BALL = (() => {
  const capacitorsByTargetBall = new Map<
    string,
    (typeof AM62L_ALL_DECOUPLING_CAPACITORS)[number]
  >()
  for (const capacitor of AM62L_ALL_DECOUPLING_CAPACITORS) {
    if (!capacitorsByTargetBall.has(capacitor.targetBall)) {
      capacitorsByTargetBall.set(capacitor.targetBall, capacitor)
    }
  }
  return capacitorsByTargetBall
})()
const AM62L_TARGET_BALLS_BY_RAIL = (() => {
  const targetBallsByRail = new Map<string, string[]>()
  for (const capacitor of AM62L_UNPLACED_DIRECT_DECOUPLING_CAPACITORS) {
    const targetBalls = targetBallsByRail.get(capacitor.railNetName) ?? []
    if (!targetBalls.includes(capacitor.targetBall)) {
      targetBalls.push(capacitor.targetBall)
    }
    targetBallsByRail.set(capacitor.railNetName, targetBalls)
  }
  targetBallsByRail.set("VDD_LPDDR4", [...AM62L_VDDS_DDR_BALLS])
  return targetBallsByRail
})()
const AM62L_SPECIAL_CAP_BALL_NAME_SET = new Set<string>(
  AM62L_SPECIAL_CAP_BALLS.map(({ ballName }) => ballName),
)
const AM62L_PIN_ATTRIBUTES = Object.fromEntries(
  AM62L_POWER_BALLS.filter(({ pinSignal }) => pinSignal !== "VSS").map(
    ({ ballName }) => {
      const capacitor = AM62L_DECOUPLING_CAPACITOR_BY_TARGET_BALL.get(ballName)
      if (!capacitor) {
        throw new Error(`Missing AM62L decoupling capacitor for ${ballName}`)
      }
      return [
        ballName,
        {
          requiresPower: !AM62L_SPECIAL_CAP_BALL_NAME_SET.has(ballName),
          shouldHaveDecouplingCapacitor: true,
          recommendedDecouplingCapacitorCapacitance: capacitor.capacitance,
        },
      ]
    },
  ),
) as NonNullable<ChipProps<typeof AM62L_PIN_LABELS>["pinAttributes"]>

const Am62l32 = (props: ChipProps<typeof AM62L_PIN_LABELS>) => (
  <chip
    {...props}
    pinLabels={AM62L_PIN_LABELS}
    manufacturerPartNumber="AM62L32BOGHAANBR"
    footprint={
      <footprint>
        {AM62L_PAD_POSITIONS.map(({ ballName, pinNumber, x, y }) => (
          <Fragment key={`am62l-pad-${pinNumber}`}>
            <smtpad
              portHints={[`pin${pinNumber}`, ballName]}
              pcbX={x}
              pcbY={y}
              radius="0.12808mm"
              shape="circle"
            />
          </Fragment>
        ))}
        <silkscreenpath
          route={[
            { x: -5.95, y: -5.95 },
            { x: 5.95, y: -5.95 },
            { x: 5.95, y: 5.95 },
            { x: -5.95, y: 5.95 },
            { x: -5.95, y: -5.95 },
          ]}
        />
        <silkscreencircle pcbX={-5.55} pcbY={5.55} radius="0.18mm" />
      </footprint>
    }
  />
)

const LPDDR4_BALL_ROWS = [
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
const LPDDR4_BALL_COLUMNS = [1, 2, 3, 4, 5, 8, 9, 10, 11, 12] as const
const LPDDR4_BALL_NAMES = LPDDR4_BALL_ROWS.flatMap((rowName) =>
  LPDDR4_BALL_COLUMNS.map((columnNumber) => `${rowName}${columnNumber}`),
)
const LPDDR4_PIN_NUMBER_BY_BALL = new Map(
  LPDDR4_BALL_NAMES.map((ballName, index) => [ballName, index + 1]),
)

const LPDDR4_VDDQ_BALLS = parseBallList(`
  B3 B5 B8 B10 D1 D5 D8 D12 F3 F10 U3 U10 W1 W5 W8 W12
  AA3 AA5 AA8 AA10
`)
const LPDDR4_VDD2_BALLS = parseBallList(`
  A4 A9 F5 F8 H1 H5 H8 H12 K1 K3 K10 K12 N1 N3 N10 N12
  R1 R5 R8 R12 U5 U8 AB4 AB9
`)
const LPDDR4_VSS_BALLS = parseBallList(`
  A3 A10 C1 C5 C8 C12 D2 D4 D9 D11 E1 E5 E8 E12 G1 G3 G5 G8 G10 G12
  J1 J3 J10 J12 K2 K4 K9 K11 N2 N4 N9 N11 P1 P3 P10 P12 T1 T3 T5 T8
  T10 T12 V1 V5 V8 V12 W2 W4 W9 W11 Y1 Y5 Y8 Y12 AB3 AB5 AB8 AB10
`)
const LPDDR4_VDD1_BALLS = parseBallList("F1 F12 G4 G9 T4 T9 U1 U12")

const createLpddr4BallAssignments = <
  const BallName extends string,
  const PinSignal extends string,
>(
  ballNames: readonly BallName[],
  pinSignal: PinSignal,
) =>
  ballNames.map((ballName) => ({
    ballName,
    pinNumber: getRequiredPinNumber(
      LPDDR4_PIN_NUMBER_BY_BALL,
      ballName,
      "MT53E1G16D1ZW",
    ),
    pinSignal,
  }))

const LPDDR4_POWER_BALLS = [
  ...createLpddr4BallAssignments(LPDDR4_VSS_BALLS, "VSS"),
  ...createLpddr4BallAssignments(LPDDR4_VDDQ_BALLS, "VDDQ"),
  ...createLpddr4BallAssignments(LPDDR4_VDD2_BALLS, "VDD2"),
]
const LPDDR4_VDD1_ASSIGNMENTS = createLpddr4BallAssignments(
  LPDDR4_VDD1_BALLS,
  "VDD1",
)

const LPDDR4_PIN_LABELS = {
  ...Object.fromEntries(
    [...LPDDR4_POWER_BALLS, ...LPDDR4_VDD1_ASSIGNMENTS].map(
      ({ ballName, pinNumber, pinSignal }) => [
        `pin${pinNumber}`,
        [ballName, pinSignal],
      ],
    ),
  ),
  ...Object.fromEntries(
    [
      ...DDR_ADDR_CTRL_CONNECTIONS,
      ...DDR_CLOCK_CONNECTIONS,
      ...DDR_DQS0_CONNECTIONS,
      ...DDR_DQS1_CONNECTIONS,
      DDR_RESET_CONNECTION,
      DDR_DMI0_CONNECTION,
      DDR_DMI1_CONNECTION,
    ].map(({ memoryBall, memoryPinNumber, memorySignal }) => [
      `pin${memoryPinNumber}`,
      [memoryBall, memorySignal],
    ]),
  ),
  pin12: ["B2", "DQ0"],
  pin14: ["B4", "DQ7"],
  pin17: ["B9", "DQ15"],
  pin19: ["B11", "DQ8"],
  pin22: ["C2", "DQ1"],
  pin24: ["C4", "DQ6"],
  pin27: ["C9", "DQ14"],
  pin29: ["C11", "DQ9"],
  pin42: ["E2", "DQ2"],
  pin44: ["E4", "DQ5"],
  pin47: ["E9", "DQ13"],
  pin49: ["E11", "DQ10"],
  pin52: ["F2", "DQ3"],
  pin54: ["F4", "DQ4"],
  pin57: ["F9", "DQ12"],
  pin59: ["F11", "DQ11"],
} as const

const LPDDR4_BALL_X = [-4.4, -3.6, -2.8, -2, -1.2, 1.2, 2, 2.8, 3.6, 4.4]
const LPDDR4_BALL_Y = [
  6.825, 6.175, 5.525, 4.875, 4.225, 3.575, 2.925, 2.275, 1.625, 0.975, -0.975,
  -1.625, -2.275, -2.925, -3.575, -4.225, -4.875, -5.525, -6.175, -6.825,
]
const LPDDR4_BALL_POSITIONS = LPDDR4_BALL_Y.flatMap((y) =>
  LPDDR4_BALL_X.map((x) => ({ x, y })),
)

const Mt53e1g16d1zw = (props: ChipProps<typeof LPDDR4_PIN_LABELS>) => (
  <chip
    {...props}
    pinLabels={LPDDR4_PIN_LABELS}
    manufacturerPartNumber="MT53E1G16D1ZW"
    footprint={
      <footprint>
        {LPDDR4_BALL_POSITIONS.map(({ x, y }, index) => (
          <Fragment key={`lpddr4-ball-${index + 1}`}>
            <smtpad
              portHints={[`pin${index + 1}`, LPDDR4_BALL_NAMES[index]!]}
              pcbX={x}
              pcbY={y}
              radius="0.16mm"
              shape="circle"
            />
          </Fragment>
        ))}
        <silkscreenpath
          route={[
            { x: -5, y: -7.25 },
            { x: 5, y: -7.25 },
            { x: 5, y: 7.25 },
            { x: -5, y: 7.25 },
            { x: -5, y: -7.25 },
          ]}
        />
        <silkscreencircle pcbX={-4.65} pcbY={6.9} radius="0.18mm" />
      </footprint>
    }
  />
)

const GROUND_PLANE_LAYER = "inner1"
const LPDDR4_POWER_PLANE_LAYER = "inner2"
const LPDDR4_VDD1_PLANE_LAYER = "inner3"
const LPDDR4_POWER_NET = "VDD_LPDDR4"
const LPDDR4_VDD1_NET = "SOC_DVDD1V8"
const SOC_PCB_X = -9.5
const SOC_PCB_Y = 0
const POWER_FANOUT_SIGNAL_LAYERS = [
  "top",
  "inner4",
  "inner5",
  "inner6",
  "bottom",
] as const
const SIGNAL_ONLY_LAYERS = ["top", "inner1", "inner2", "bottom"] as const

const createPlaneDrops = (
  componentName: "U1" | "U2",
  fanoutPhaseIndex: 0 | 1,
  netName: "GND" | typeof LPDDR4_POWER_NET | typeof LPDDR4_VDD1_NET,
  layer:
    | typeof GROUND_PLANE_LAYER
    | typeof LPDDR4_POWER_PLANE_LAYER
    | typeof LPDDR4_VDD1_PLANE_LAYER,
  ballAssignments: readonly {
    ballName: string
    pinNumber: number
    pinSignal: string
  }[],
) =>
  ballAssignments.map(({ ballName, pinNumber, pinSignal }) => ({
    ballName,
    componentName,
    fanoutPhaseIndex,
    fromLayer: "top" as const,
    layer,
    netName,
    pinNumber,
    pinSignal,
    traceName: `${componentName}_${pinSignal}_${ballName}_DROP`,
  }))

const SOC_PLANE_DROPS = [
  ...createPlaneDrops(
    "U1",
    0,
    "GND",
    GROUND_PLANE_LAYER,
    AM62L_POWER_BALLS.filter(({ pinSignal }) => pinSignal === "VSS"),
  ),
  ...createPlaneDrops(
    "U1",
    0,
    LPDDR4_POWER_NET,
    LPDDR4_POWER_PLANE_LAYER,
    AM62L_POWER_BALLS.filter(({ pinSignal }) => pinSignal === "VDDS_DDR"),
  ),
]
const DRAM_PLANE_DROPS = [
  ...createPlaneDrops(
    "U2",
    1,
    "GND",
    GROUND_PLANE_LAYER,
    LPDDR4_POWER_BALLS.filter(({ pinSignal }) => pinSignal === "VSS"),
  ),
  ...createPlaneDrops(
    "U2",
    1,
    LPDDR4_POWER_NET,
    LPDDR4_POWER_PLANE_LAYER,
    LPDDR4_POWER_BALLS.filter(
      ({ pinSignal }) => pinSignal === "VDDQ" || pinSignal === "VDD2",
    ),
  ),
  ...createPlaneDrops(
    "U2",
    1,
    LPDDR4_VDD1_NET,
    LPDDR4_VDD1_PLANE_LAYER,
    LPDDR4_VDD1_ASSIGNMENTS,
  ),
]
const SOC_DDR_DECOUPLING_PLANE_DROPS = AM62L_DDR_DECOUPLING_CAPACITORS.flatMap(
  (capacitor) => {
    const { groundViaOffset, name, vddViaOffset } = capacitor
    return [
      {
        ballName: "pin1",
        componentName: name,
        fanoutPhaseIndex: 0 as const,
        fromLayer: "bottom" as const,
        layer: "inner2" as const,
        netName: LPDDR4_POWER_NET,
        pinNumber: 1,
        pinSignal: "pos",
        pcbPath: [
          {
            ...vddViaOffset,
            via: true as const,
            fromLayer: "bottom" as const,
            toLayer: "inner2" as const,
          },
        ],
        pcbPathRelativeTo: `.${name} > .pin1`,
        traceName: `${name}_VDD_DROP`,
      },
      {
        ballName: "pin2",
        componentName: name,
        fanoutPhaseIndex: 0 as const,
        fromLayer: "bottom" as const,
        layer: "inner1" as const,
        netName: "GND" as const,
        pinNumber: 2,
        pinSignal: "neg",
        pcbPath: [
          {
            ...groundViaOffset,
            via: true as const,
            fromLayer: "bottom" as const,
            toLayer: "inner1" as const,
          },
        ],
        pcbPathRelativeTo: `.${name} > .pin2`,
        traceName: `${name}_GND_DROP`,
      },
    ]
  },
)
// These descriptors cover source connectivity for the manually authored local
// GND handoffs. They are not fanout-solver plane drops.
const SOC_DIRECT_DECOUPLING_GROUND_MEMBERS =
  AM62L_DIRECT_DECOUPLING_CAPACITORS.map((capacitor) => ({
    componentName: capacitor.name,
    netName: "GND" as const,
    pinNumber: 2,
  }))
const PLANE_DROPS = [...SOC_PLANE_DROPS, ...DRAM_PLANE_DROPS]

const byte0TraceNames = DDR_CONNECTIONS.filter(
  ({ busName }) => busName === "DDR_BYTE0",
).map(({ traceName }) => traceName)
const byte1TraceNames = DDR_CONNECTIONS.filter(
  ({ busName }) => busName === "DDR_BYTE1",
).map(({ traceName }) => traceName)
const addrCtrlTraceNames = DDR_ADDR_CTRL_CONNECTIONS.map(
  ({ traceName }) => traceName,
)
const clockTraceNames: [string, string] = [
  DDR_CLOCK_CONNECTIONS[0]!.traceName,
  DDR_CLOCK_CONNECTIONS[1]!.traceName,
]
const dqs0TraceNames: [string, string] = [
  DDR_DQS0_CONNECTIONS[0]!.traceName,
  DDR_DQS0_CONNECTIONS[1]!.traceName,
]
const dqs1TraceNames: [string, string] = [
  DDR_DQS1_CONNECTIONS[0]!.traceName,
  DDR_DQS1_CONNECTIONS[1]!.traceName,
]
const resetTraceNames = [DDR_RESET_CONNECTION.traceName] as const
const dmi0TraceNames = [DDR_DMI0_CONNECTION.traceName] as const
const dmi1TraceNames = [DDR_DMI1_CONNECTION.traceName] as const
const BYTE0_MAX_FANOUT_SKEW = 8
const BYTE1_MAX_FANOUT_SKEW = 14.5
const ADDR_CTRL_MAX_FANOUT_SKEW = 15
const CLOCK_MAX_FANOUT_SKEW = 0.25
const DQS0_MAX_FANOUT_SKEW = 0.25
const DQS1_MAX_FANOUT_SKEW = 0.25
const CLOCK_MAX_END_TO_END_SKEW = CLOCK_MAX_FANOUT_SKEW * 2
// Regression target for both fanouts plus the direct global segment; the two
// phase-local skew limits do not by themselves guarantee this aggregate.
const DQS0_MAX_END_TO_END_SKEW = 0.5
const DQS1_MAX_END_TO_END_SKEW = 0.5

const FANOUT_BUSES = [
  {
    name: "DDR_BYTE0",
    connections: byte0TraceNames,
    preferredLayers: ["top", "inner4"],
    maxLengthSkew: BYTE0_MAX_FANOUT_SKEW,
  },
  {
    name: "DDR_BYTE1",
    connections: byte1TraceNames,
    preferredLayers: ["inner5", "bottom"],
    maxLengthSkew: BYTE1_MAX_FANOUT_SKEW,
  },
  {
    name: "DDR_ADDR_CTRL",
    connections: addrCtrlTraceNames,
    preferredLayers: ["inner6"],
    maxLengthSkew: ADDR_CTRL_MAX_FANOUT_SKEW,
  },
  {
    name: "DDR_CLOCK",
    connections: clockTraceNames,
    preferredLayers: ["inner5"],
    maxLengthSkew: CLOCK_MAX_FANOUT_SKEW,
  },
  {
    name: "DDR_DQS0",
    connections: dqs0TraceNames,
    preferredLayers: ["inner5"],
    maxLengthSkew: DQS0_MAX_FANOUT_SKEW,
  },
  {
    name: "DDR_DQS1",
    connections: dqs1TraceNames,
    preferredLayers: ["inner5"],
    maxLengthSkew: DQS1_MAX_FANOUT_SKEW,
  },
  {
    name: "DDR_RESET",
    connections: resetTraceNames,
    preferredLayers: ["inner6"],
    maxLengthSkew: undefined,
  },
  {
    name: "DDR_DMI0",
    connections: dmi0TraceNames,
    preferredLayers: ["inner5"],
    maxLengthSkew: undefined,
  },
  {
    name: "DDR_DMI1",
    connections: dmi1TraceNames,
    preferredLayers: ["inner5"],
    maxLengthSkew: undefined,
  },
] as const

type PlanarRoute = readonly {
  route_type: string
  x?: number
  y?: number
  layer?: string
}[]

const getPlanarRouteLength = (route: PlanarRoute): number => {
  let previousWire: { x: number; y: number; layer: string } | undefined
  let length = 0
  for (const routePoint of route) {
    if (
      routePoint.route_type !== "wire" ||
      routePoint.x === undefined ||
      routePoint.y === undefined ||
      routePoint.layer === undefined
    ) {
      previousWire = undefined
      continue
    }
    if (previousWire?.layer === routePoint.layer) {
      length += Math.hypot(
        routePoint.x - previousWire.x,
        routePoint.y - previousWire.y,
      )
    }
    previousWire = {
      x: routePoint.x,
      y: routePoint.y,
      layer: routePoint.layer,
    }
  }
  return length
}

const getPlanarTraceLength = (trace: SimplifiedPcbTrace): number =>
  getPlanarRouteLength(trace.route)

const routeConnectionsDirectly = async (
  simpleRouteJson: SimpleRouteJson,
): Promise<SimplifiedPcbTrace[]> =>
  simpleRouteJson.connections.map((connection, connectionIndex) => ({
    type: "pcb_trace",
    pcb_trace_id: `straight_global_trace_${connectionIndex}`,
    connection_name: connection.source_trace_id ?? connection.name,
    route: connection.pointsToConnect.map((point) => ({
      route_type: "wire",
      x: point.x,
      y: point.y,
      width: connection.nominalTraceWidth ?? simpleRouteJson.minTraceWidth,
      layer: point.layer,
    })),
  }))

const getStraightLineWindingConflicts = (simpleRouteJson: SimpleRouteJson) => {
  const epsilon = 1e-9
  const segments = simpleRouteJson.connections.map((connection) => {
    if (connection.pointsToConnect.length !== 2) {
      throw new Error(
        `Expected two global endpoints for ${connection.name}, received ${connection.pointsToConnect.length}`,
      )
    }
    const [firstPoint, secondPoint] = connection.pointsToConnect
    if (!firstPoint || !secondPoint) {
      throw new Error(`Missing a global endpoint for ${connection.name}`)
    }
    const [left, right] =
      firstPoint.x <= secondPoint.x
        ? [firstPoint, secondPoint]
        : [secondPoint, firstPoint]
    if (right.x - left.x <= epsilon) {
      throw new Error(
        `Expected facing vertical fanout edges for ${connection.name}`,
      )
    }
    if (left.layer !== right.layer) {
      throw new Error(`Expected one global layer for ${connection.name}`)
    }
    return {
      connectionName: connection.source_trace_id ?? connection.name,
      layer: left.layer,
      left,
      right,
    }
  })

  const conflicts: Array<{ first: string; second: string }> = []
  for (let firstIndex = 0; firstIndex < segments.length; firstIndex++) {
    const first = segments[firstIndex]!
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < segments.length;
      secondIndex++
    ) {
      const second = segments[secondIndex]!
      if (first.layer !== second.layer) continue
      const leftDelta = first.left.y - second.left.y
      const rightDelta = first.right.y - second.right.y
      if (
        Math.abs(leftDelta) <= epsilon ||
        Math.abs(rightDelta) <= epsilon ||
        leftDelta * rightDelta < 0
      ) {
        conflicts.push({
          first: first.connectionName,
          second: second.connectionName,
        })
      }
    }
  }
  return conflicts
}

export type FanoutAlgorithmFn = (
  simpleRouteJson: SimpleRouteJson,
) => Promise<GenericLocalAutorouter>

export const renderAm62lLpddr4Fanout = async ({
  fanoutAlgorithmFn,
  fanoutSolverLabel,
  includeBottomDecouplingCapacitors = false,
  includePowerPlaneFanout = false,
  routedDdrDataTraceNames,
  snapshotDiffThresholdPercent = 0.05,
  snapshotPath,
  usePublicPipeline9Preset = false,
  useProductionGlobalAutorouter = false,
}: {
  fanoutAlgorithmFn?: FanoutAlgorithmFn
  fanoutSolverLabel?: string
  includeBottomDecouplingCapacitors?: boolean
  includePowerPlaneFanout?: boolean
  routedDdrDataTraceNames?: readonly string[]
  snapshotDiffThresholdPercent?: number
  snapshotPath: string
  usePublicPipeline9Preset?: boolean
  useProductionGlobalAutorouter?: boolean
}) => {
  const includeCompleteDecouplingNetwork =
    includePowerPlaneFanout && !includeBottomDecouplingCapacitors
  const { circuit } = getTestFixture({
    // The generic placement check is not layer-aware and treats intentional
    // bottom-side decouplers under the top-side BGA as component overlaps.
    platform: { placementDrcChecksDisabled: includePowerPlaneFanout },
  })
  const autoroutingPhaseIoStack = createAutoroutingPhaseIoStack(circuit)
  const signalLayers = includePowerPlaneFanout
    ? POWER_FANOUT_SIGNAL_LAYERS
    : SIGNAL_ONLY_LAYERS
  const routedDdrDataTraceNameSet = new Set(
    routedDdrDataTraceNames ??
      DDR_CONNECTIONS.map(({ traceName }) => traceName),
  )
  const signalConnections = includePowerPlaneFanout
    ? DDR_SIGNAL_CONNECTIONS
    : DDR_CONNECTIONS.filter(({ traceName }) =>
        routedDdrDataTraceNameSet.has(traceName),
      )
  const fanoutBuses = FANOUT_BUSES.filter(
    (bus) =>
      includePowerPlaneFanout ||
      bus.name === "DDR_BYTE0" ||
      bus.name === "DDR_BYTE1",
  )
    .map((bus) => ({
      ...bus,
      connections: includePowerPlaneFanout
        ? bus.connections
        : bus.connections.filter((traceName) =>
            routedDdrDataTraceNameSet.has(traceName),
          ),
      maxLengthSkew:
        includePowerPlaneFanout || bus.name === "DDR_BYTE0"
          ? bus.maxLengthSkew
          : undefined,
      preferredLayers: includePowerPlaneFanout
        ? bus.preferredLayers
        : bus.name === "DDR_BYTE0"
          ? (["top", "inner1"] as const)
          : (["inner2", "bottom"] as const),
    }))
    .filter((bus) => bus.connections.length > 0)
  const socPlaneDrops = includePowerPlaneFanout ? SOC_PLANE_DROPS : []
  const decouplingPlaneDrops = includeCompleteDecouplingNetwork
    ? SOC_DDR_DECOUPLING_PLANE_DROPS
    : []
  const dramPlaneDrops = includePowerPlaneFanout ? DRAM_PLANE_DROPS : []
  const planeDrops = includePowerPlaneFanout ? PLANE_DROPS : []
  const expectedPlaneMembers = includePowerPlaneFanout
    ? [
        ...PLANE_DROPS,
        ...SOC_DDR_DECOUPLING_PLANE_DROPS,
        ...SOC_DIRECT_DECOUPLING_GROUND_MEMBERS,
      ]
    : []
  const routedPlaneDrops = includePowerPlaneFanout
    ? [...PLANE_DROPS, ...SOC_DDR_DECOUPLING_PLANE_DROPS]
    : []
  const renderedDirectDecouplingCapacitors: Array<
    (typeof AM62L_DIRECT_DECOUPLING_CAPACITORS)[number]
  > = [...AM62L_DIRECT_DECOUPLING_CAPACITORS]
  const renderedAllDecouplingCapacitors: Array<
    (typeof AM62L_ALL_DECOUPLING_CAPACITORS)[number]
  > = [...AM62L_ALL_DECOUPLING_CAPACITORS]
  const includesByte0 = fanoutBuses.some(({ name }) => name === "DDR_BYTE0")
  const includesByte1 = fanoutBuses.some(({ name }) => name === "DDR_BYTE1")
  const socBusFanoutDirections = {
    ...(includesByte0 ? { DDR_BYTE0: "rightside_top" as const } : {}),
    ...(includesByte1 ? { DDR_BYTE1: "rightside_bottom" as const } : {}),
    ...(includePowerPlaneFanout
      ? {
          DDR_ADDR_CTRL: "rightside_center" as const,
          DDR_CLOCK: "rightside_top" as const,
          DDR_DQS0: "rightside_top" as const,
          DDR_DQS1: "rightside_center" as const,
          DDR_RESET: "rightside_center" as const,
          DDR_DMI0: "rightside_top" as const,
          DDR_DMI1: "rightside_bottom" as const,
        }
      : {}),
  } as const
  const dramBusFanoutDirections = {
    ...(includesByte0 ? { DDR_BYTE0: "leftside_center" as const } : {}),
    ...(includesByte1 ? { DDR_BYTE1: "leftside_center" as const } : {}),
    ...(includePowerPlaneFanout
      ? {
          DDR_ADDR_CTRL: "leftside_center" as const,
          DDR_CLOCK: "leftside_top" as const,
          DDR_DQS0: "leftside_top" as const,
          DDR_DQS1: "leftside_center" as const,
          DDR_RESET: "leftside_top" as const,
          DDR_DMI0: "leftside_top" as const,
          DDR_DMI1: "leftside_center" as const,
        }
      : {}),
  } as const
  const fanoutAutorouter = fanoutAlgorithmFn
    ? { preset: "fanout" as const, algorithmFn: fanoutAlgorithmFn }
    : "fanout"
  const productionGlobalAutorouter = usePublicPipeline9Preset
    ? ("beta_pipeline9" as const)
    : getPresetAutoroutingConfig("beta_pipeline9")

  const routeGlobalConnections = async (
    simpleRouteJson: SimpleRouteJson,
  ): Promise<SimplifiedPcbTrace[]> => {
    const decouplingDropBySourceTraceId = new Map(
      SOC_DDR_DECOUPLING_PLANE_DROPS.flatMap((drop) => {
        const sourceTrace = circuit.db.source_trace.getWhere({
          name: drop.traceName,
        })
        return sourceTrace ? [[sourceTrace.source_trace_id, drop] as const] : []
      }),
    )
    return simpleRouteJson.connections.flatMap(
      (connection, connectionIndex): SimplifiedPcbTrace[] => {
        const connectionName = connection.source_trace_id ?? connection.name
        const connectionIds = new Set(
          [
            connection.name,
            connection.source_trace_id,
            connection.rootConnectionName,
            ...(connection.mergedConnectionNames ?? []),
          ].filter(
            (identifier): identifier is string => identifier !== undefined,
          ),
        )
        const drop = [...connectionIds]
          .map((identifier) => decouplingDropBySourceTraceId.get(identifier))
          .find((candidate) => candidate !== undefined)
        if (!drop) {
          return [
            {
              type: "pcb_trace",
              pcb_trace_id: `straight_global_trace_${connectionIndex}`,
              connection_name: connectionName,
              route: connection.pointsToConnect.map((point) => ({
                route_type: "wire" as const,
                x: point.x,
                y: point.y,
                width:
                  connection.nominalTraceWidth ?? simpleRouteJson.minTraceWidth,
                layer: point.layer,
              })),
            },
          ]
        }

        const capacitor = AM62L_ALL_DECOUPLING_CAPACITORS.find(
          ({ name }) => name === drop.componentName,
        )!
        const componentCenter = {
          x: SOC_PCB_X + capacitor.pcbX,
          y: SOC_PCB_Y + capacitor.pcbY,
        }
        const angle = (capacitor.pcbRotation * Math.PI) / 180
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        const toGlobalPoint = ({ x, y }: { x: number; y: number }) => ({
          x: componentCenter.x + x * cos - y * sin,
          y: componentCenter.y + x * sin + y * cos,
        })
        const componentPortSelector = `${capacitor.name}.${drop.ballName}`
        const startPoint =
          connection.pointsToConnect.find(
            ({ port_selector: portSelector }) =>
              portSelector === componentPortSelector,
          ) ?? connection.pointsToConnect[0]!
        const width =
          connection.nominalTraceWidth ?? simpleRouteJson.minTraceWidth
        let currentLayer: string = drop.fromLayer

        return [
          {
            type: "pcb_trace" as const,
            pcb_trace_id: `decoupling_global_trace_${connectionIndex}`,
            connection_name: connectionName,
            route: [
              {
                route_type: "wire" as const,
                x: startPoint.x,
                y: startPoint.y,
                width,
                layer: currentLayer,
              },
              ...drop.pcbPath.map((pathPoint) => {
                const point = toGlobalPoint(pathPoint)
                if ("via" in pathPoint && pathPoint.via) {
                  const fromLayer = pathPoint.fromLayer ?? currentLayer
                  const toLayer = pathPoint.toLayer ?? currentLayer
                  currentLayer = toLayer
                  return {
                    route_type: "via" as const,
                    ...point,
                    from_layer: fromLayer,
                    to_layer: toLayer,
                    via_diameter: 0.24,
                    via_hole_diameter: 0.15,
                  }
                }
                return {
                  route_type: "wire" as const,
                  ...point,
                  width,
                  layer: currentLayer,
                }
              }),
            ],
          },
        ]
      },
    )
  }

  expect(AM62L_PAD_POSITIONS).toHaveLength(373)
  expect(AM62L_VSS_BALLS).toHaveLength(97)
  expect(AM62L_VDDS_DDR_BALLS).toHaveLength(5)
  expect(LPDDR4_BALL_NAMES).toHaveLength(200)
  expect(LPDDR4_VSS_BALLS).toHaveLength(58)
  expect(LPDDR4_VDDQ_BALLS).toHaveLength(20)
  expect(LPDDR4_VDD2_BALLS).toHaveLength(24)
  expect(LPDDR4_VDD1_BALLS).toHaveLength(8)
  expect(signalConnections).toHaveLength(
    includePowerPlaneFanout ? 33 : (routedDdrDataTraceNames?.length ?? 16),
  )
  expect(
    signalConnections.filter(({ traceName }) => traceName === "RESET_n"),
  ).toEqual(includePowerPlaneFanout ? [DDR_RESET_CONNECTION] : [])
  expect(
    signalConnections.filter(({ busName }) => busName === "DDR_DQS0"),
  ).toEqual(includePowerPlaneFanout ? [...DDR_DQS0_CONNECTIONS] : [])
  expect(
    signalConnections.filter(({ busName }) => busName === "DDR_DQS1"),
  ).toEqual(includePowerPlaneFanout ? [...DDR_DQS1_CONNECTIONS] : [])
  expect(
    signalConnections.filter(({ busName }) => busName === "DDR_DMI0"),
  ).toEqual(includePowerPlaneFanout ? [DDR_DMI0_CONNECTION] : [])
  expect(
    signalConnections.filter(({ busName }) => busName === "DDR_DMI1"),
  ).toEqual(includePowerPlaneFanout ? [DDR_DMI1_CONNECTION] : [])

  circuit.add(
    <board
      name={
        includeBottomDecouplingCapacitors
          ? "AM62L_LPDDR4_DECOUPLING_PACKING"
          : includePowerPlaneFanout
            ? "AM62L_LPDDR4_PROGRESSIVE_FANOUT"
            : "AM62L_LPDDR4_TWO_BUS_FANOUT"
      }
      width="40mm"
      height="20mm"
      layers={includePowerPlaneFanout ? 8 : 4}
      defaultTraceWidth="0.08128mm"
      minTraceWidth="0.08128mm"
      minTraceToPadEdgeClearance="0.05mm"
      minViaEdgeToPadEdgeClearance="0.08128mm"
      minViaHoleEdgeToViaHoleEdgeClearance="0.1016mm"
      minViaHoleDiameter="0.15mm"
      minViaPadDiameter="0.24mm"
      pcbStyle={{ viaHoleDiameter: "0.15mm", viaPadDiameter: "0.24mm" }}
      allowBlindAndBuriedVias={false}
      isViaInPadAllowed={false}
      autorouter="default"
    >
      {includeCompleteDecouplingNetwork &&
        AM62L_DIRECT_RAIL_NET_NAMES.map((railNetName) => (
          <Fragment key={railNetName}>
            <net name={railNetName} />
          </Fragment>
        ))}
      <autoroutingphase
        autorouter={
          useProductionGlobalAutorouter
            ? productionGlobalAutorouter
            : {
                algorithmFn: createBasicAutorouter(
                  includePowerPlaneFanout
                    ? routeGlobalConnections
                    : routeConnectionsDirectly,
                ),
              }
        }
      />
      {includePowerPlaneFanout && (
        <Fragment>
          <copperpour layer={GROUND_PLANE_LAYER} connectsTo="net.GND" />
          <copperpour
            layer={LPDDR4_POWER_PLANE_LAYER}
            connectsTo={`net.${LPDDR4_POWER_NET}`}
          />
          <copperpour
            layer={LPDDR4_VDD1_PLANE_LAYER}
            connectsTo={`net.${LPDDR4_VDD1_NET}`}
          />
        </Fragment>
      )}
      <breakout
        name="SOC_FANOUT"
        pcbX={SOC_PCB_X}
        pcbY={SOC_PCB_Y}
        padding={includePowerPlaneFanout ? "3mm" : "2mm"}
        pcbPack={includeBottomDecouplingCapacitors}
        pcbGap="0.2mm"
        autorouter={fanoutAutorouter}
        fanoutRoutingLayers={[...signalLayers]}
        busFanoutDirections={socBusFanoutDirections}
      >
        <Am62l32
          name="U1"
          noSchematicRepresentation
          pinAttributes={
            includeCompleteDecouplingNetwork ? AM62L_PIN_ATTRIBUTES : undefined
          }
        />
        {includeBottomDecouplingCapacitors && (
          <Fragment>
            <capacitor
              name="C1"
              capacitance="100nF"
              footprint="0402"
              layer="bottom"
            />
            <capacitor
              name="C2"
              capacitance="100nF"
              footprint="0402"
              layer="bottom"
            />
            <capacitor
              name="C3"
              capacitance="100nF"
              footprint="0402"
              layer="bottom"
            />
            <trace from=".U1 > .L8" to=".C1 > .pin1" />
            <trace from=".U1 > .L9" to=".C1 > .pin2" />
            <trace from=".U1 > .M7" to=".C2 > .pin1" />
            <trace from=".U1 > .N7" to=".C2 > .pin2" />
            <trace from=".U1 > .P8" to=".C3 > .pin1" />
            <trace from=".U1 > .P9" to=".C3 > .pin2" />
          </Fragment>
        )}
        {socPlaneDrops.map((drop) => (
          <Fragment key={drop.traceName}>
            <trace
              name={drop.traceName}
              from={`.${drop.componentName} > .${drop.ballName}`}
              to={`net.${drop.netName}`}
            />
          </Fragment>
        ))}
      </breakout>

      <breakout
        name="DRAM_FANOUT"
        pcbX={9.616917}
        pcbY={includePowerPlaneFanout ? 1.81916 : -0.050917}
        padding={includePowerPlaneFanout ? "3mm" : "2.5mm"}
        pcbPack={includeBottomDecouplingCapacitors}
        pcbGap="0.2mm"
        autorouter={fanoutAutorouter}
        fanoutRoutingLayers={[...signalLayers]}
        busFanoutDirections={dramBusFanoutDirections}
      >
        <Mt53e1g16d1zw name="U2" pcbRotation={90} noSchematicRepresentation />
        {includeBottomDecouplingCapacitors && (
          <Fragment>
            <capacitor
              name="C4"
              capacitance="100nF"
              footprint="0402"
              layer="bottom"
            />
            <capacitor
              name="C5"
              capacitance="100nF"
              footprint="0402"
              layer="bottom"
            />
            <capacitor
              name="C6"
              capacitance="100nF"
              footprint="0402"
              layer="bottom"
            />
            <capacitor
              name="C7"
              capacitance="100nF"
              footprint="0402"
              layer="bottom"
            />
            <capacitor
              name="C8"
              capacitance="100nF"
              footprint="0402"
              layer="bottom"
            />
            <trace from=".U2 > .B3" to=".C4 > .pin1" />
            <trace from=".U2 > .A3" to=".C4 > .pin2" />
            <trace from=".U2 > .F3" to=".C5 > .pin1" />
            <trace from=".U2 > .G3" to=".C5 > .pin2" />
            <trace from=".U2 > .U3" to=".C6 > .pin1" />
            <trace from=".U2 > .T3" to=".C6 > .pin2" />
            <trace from=".U2 > .AA3" to=".C7 > .pin1" />
            <trace from=".U2 > .AB3" to=".C7 > .pin2" />
            <trace from=".U2 > .F1" to=".C8 > .pin1" />
            <trace from=".U2 > .G1" to=".C8 > .pin2" />
          </Fragment>
        )}
        {dramPlaneDrops.map((drop) => (
          <Fragment key={drop.traceName}>
            <trace
              name={drop.traceName}
              from={`.U2 > .${drop.ballName}`}
              to={`net.${drop.netName}`}
            />
          </Fragment>
        ))}
      </breakout>

      {includeCompleteDecouplingNetwork &&
        AM62L_DDR_DECOUPLING_CAPACITORS.map((capacitor) => (
          <capacitor
            key={capacitor.name}
            name={capacitor.name}
            capacitance={capacitor.capacitance}
            footprint="cap0201_nosilkscreen"
            layer="bottom"
            maxDecouplingTraceLength={`${AM62L_DDR_MAX_DECOUPLING_DISTANCE}mm`}
            pcbX={SOC_PCB_X + capacitor.pcbX}
            pcbY={SOC_PCB_Y + capacitor.pcbY}
            pcbRotation={capacitor.pcbRotation}
          />
        ))}
      {decouplingPlaneDrops
        .filter((drop) =>
          AM62L_DDR_DECOUPLING_CAPACITORS.some(
            ({ name }) => name === drop.componentName,
          ),
        )
        .map((drop) => (
          <Fragment key={drop.traceName}>
            <trace
              name={drop.traceName}
              from={`.${drop.componentName} > .${drop.ballName}`}
              to={`net.${drop.netName}`}
            />
          </Fragment>
        ))}

      {fanoutBuses.map(
        ({ name, connections, preferredLayers, maxLengthSkew }) => (
          <Fragment key={name}>
            <bus
              name={name}
              connections={[...connections]}
              preferredLayers={[...preferredLayers]}
              maxLengthSkew={maxLengthSkew}
            />
          </Fragment>
        ),
      )}

      {includePowerPlaneFanout && (
        <Fragment>
          <differentialpair
            name="DDR_CLOCK_PAIR"
            positiveConnection="CK_t"
            negativeConnection="CK_c"
            maxLengthSkew={CLOCK_MAX_FANOUT_SKEW}
          />
          <differentialpair
            name="DDR_DQS0_PAIR"
            positiveConnection="DQS0_t"
            negativeConnection="DQS0_c"
            maxLengthSkew={DQS0_MAX_FANOUT_SKEW}
          />
          <differentialpair
            name="DDR_DQS1_PAIR"
            positiveConnection="DQS1_t"
            negativeConnection="DQS1_c"
            maxLengthSkew={DQS1_MAX_FANOUT_SKEW}
          />
        </Fragment>
      )}

      {signalConnections.map(({ memorySignal, socSignal, traceName }) => (
        <Fragment key={traceName}>
          <trace
            name={traceName}
            from={`U1.${socSignal}`}
            to={`U2.${memorySignal}`}
          />
        </Fragment>
      ))}
    </board>,
  )

  await circuit.renderUntilSettled()

  if (includeBottomDecouplingCapacitors) {
    const autoroutingErrors = circuit.db.pcb_autorouting_error.list()
    expect(autoroutingErrors).toHaveLength(1)
    expect(autoroutingErrors[0]?.message).toContain(
      "Autorouting was skipped because the 1mm maximum length",
    )
    expect(circuit.db.pcb_packing_error.list()).toEqual([])
    const decouplingCapacitors = circuit.db.source_component
      .list()
      .filter(({ name }) => /^C[1-8]$/.test(name))
      .map((sourceComponent) =>
        circuit.db.pcb_component.getWhere({
          source_component_id: sourceComponent.source_component_id,
        }),
      )
    expect(decouplingCapacitors).toHaveLength(8)
    expect(
      decouplingCapacitors.every(
        (pcbComponent) => pcbComponent?.layer === "bottom",
      ),
    ).toBe(true)
    await expect(circuit).toMatchPcbSnapshot(snapshotPath, {
      diffThresholdPercent: 0.05,
      shouldDrawRatsNest: true,
    })
    return
  }

  if (includeCompleteDecouplingNetwork) {
    // Route the high-speed DDR escape first, then add the remaining processor
    // decouplers as fixed copper. Feeding 60 bottom-side capacitors and their
    // through vias into the fanout solver makes the regression prohibitively
    // expensive even though those routes are already fully authored here.
    const board = circuit._getBoard()
    if (!board) throw new Error("Missing AM62L fanout board")
    const directDecouplingGroup = createInstanceFromReactElement(
      <group name="SOC_DIRECT_DECOUPLING">
        {/* The full board would join these rail members through segmented power
        planes. Keep that logical membership explicit without drawing unsafe
        post-solve chords across the BGA; the local cap-to-PDN handoff traces
        and vias below remain fully authored and DRC-checked PCB copper. */}
        <group name="SOC_DIRECT_RAIL_MEMBERSHIP" routingDisabled>
          {AM62L_DIRECT_POWER_BALLS.map((powerBall) => (
            <Fragment key={powerBall.ballName}>
              <trace
                name={`U1_${powerBall.ballName}_PDN_MEMBERSHIP`}
                from={`.U1 > .${powerBall.ballName}`}
                to={`net.${powerBall.railNetName}`}
              />
            </Fragment>
          ))}
        </group>
        {renderedDirectDecouplingCapacitors.map((capacitor) => {
          const powerViaName = `V_${capacitor.name}_POWER`
          const groundViaName = `V_${capacitor.name}_GND`
          const powerViaPosition = getDirectDecouplingViaPosition(
            capacitor,
            capacitor.powerViaOffset,
          )
          const groundViaPosition = getDirectDecouplingViaPosition(
            capacitor,
            capacitor.groundViaOffset,
          )
          return (
            <Fragment key={capacitor.name}>
              <capacitor
                name={capacitor.name}
                capacitance={capacitor.capacitance}
                footprint={capacitor.footprint}
                layer="bottom"
                maxDecouplingTraceLength={`${capacitor.maxDecouplingTraceLength}mm`}
                pcbX={SOC_PCB_X + capacitor.pcbX}
                pcbY={SOC_PCB_Y + capacitor.pcbY}
                pcbRotation={capacitor.pcbRotation}
              />
              <via
                name={powerViaName}
                pcbX={powerViaPosition.x}
                pcbY={powerViaPosition.y}
                fromLayer="top"
                toLayer="bottom"
                layers={getViaBoardLayers(8)}
                holeDiameter="0.15mm"
                outerDiameter="0.24mm"
                connectsTo={`net.${capacitor.railNetName}`}
              />
              <trace
                name={`${capacitor.name}_POWER_DROP`}
                from={`.${capacitor.name} > .pin1`}
                to={`net.${capacitor.railNetName}`}
                maxLength={`${capacitor.maxDecouplingTraceLength}mm`}
                pcbPathRelativeTo={`.${capacitor.name} > .pin1`}
                pcbPath={[`.${powerViaName} > .bottom`]}
              />
              <via
                name={groundViaName}
                pcbX={groundViaPosition.x}
                pcbY={groundViaPosition.y}
                fromLayer="top"
                toLayer="bottom"
                layers={getViaBoardLayers(8)}
                holeDiameter="0.15mm"
                outerDiameter="0.24mm"
                connectsTo="net.GND"
              />
              <trace
                name={`${capacitor.name}_GND_DROP`}
                from={`.${capacitor.name} > .pin2`}
                to="net.GND"
                maxLength={`${capacitor.maxDecouplingTraceLength}mm`}
                pcbPathRelativeTo={`.${capacitor.name} > .pin2`}
                pcbPath={[`.${groundViaName} > .bottom`]}
              />
            </Fragment>
          )
        })}
      </group>,
    )
    board.add(directDecouplingGroup)

    // Stage the new subtree through source trace creation, then refresh the
    // board connectivity map before any of its PCB primitives are emitted.
    // This preserves both correct source/PCB connectivity keys and the fast
    // DDR-first solver input.
    const sourceTraceRenderPhaseIndex =
      orderedRenderPhases.indexOf("SourceTraceRender")
    for (const phase of orderedRenderPhases.slice(
      0,
      sourceTraceRenderPhaseIndex + 1,
    )) {
      directDecouplingGroup.runRenderPhaseForChildren(phase)
      directDecouplingGroup.runRenderPhase(phase)
    }
    const boardWithRenderLifecycle = board as Board
    boardWithRenderLifecycle.doInitialSourceAddConnectivityMapKey()
    await circuit.renderUntilSettled()
    boardWithRenderLifecycle._drcChecksComplete = false
    boardWithRenderLifecycle._markDirty("PcbDesignRuleChecks")
    await circuit.renderUntilSettled()
  }

  expect(circuit.db.pcb_note_text.list()).toEqual([])
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_component_outside_board_error.list()).toEqual([])
  expect(circuit.db.pcb_trace_error.list()).toEqual([])
  expect(circuit.db.pcb_via_trace_clearance_error.list()).toEqual([])
  const pcbBoard = circuit.db.pcb_board.list()[0]!
  expect(pcbBoard.width).toBeCloseTo(40)
  expect(pcbBoard.height).toBeCloseTo(20)
  expect(pcbBoard.min_via_hole_diameter).toBeCloseTo(0.15)
  expect(pcbBoard.min_via_pad_diameter).toBeCloseTo(0.24)
  if (includePowerPlaneFanout) {
    expect(circuit.db.pcb_pad_pad_clearance_error.list()).toEqual([])
    expect(circuit.db.pcb_pad_trace_clearance_error.list()).toEqual([])
    expect(circuit.db.pcb_via_clearance_error.list()).toEqual([])
    expect(pcbBoard.allow_blind_and_buried_vias).toBe(false)
    expect(pcbBoard.is_via_in_pad_allowed).toBe(false)
    expect(pcbBoard.min_via_edge_to_pad_edge_clearance).toBeCloseTo(0.08128)

    const socSourceComponent = circuit.db.source_component.getWhere({
      name: "U1",
    })!
    const socPcbComponent = circuit.db.pcb_component.getWhere({
      source_component_id: socSourceComponent.source_component_id,
    })!
    expect(AM62L_POWER_BALLS).toHaveLength(147)
    expect(renderedDirectDecouplingCapacitors).toHaveLength(60)
    expect(renderedAllDecouplingCapacitors).toHaveLength(68)
    expect(
      renderedAllDecouplingCapacitors.filter(
        ({ placement }) => placement === "under",
      ),
    ).toHaveLength(54)
    expect(
      renderedAllDecouplingCapacitors.filter(
        ({ placement }) => placement === "perimeter",
      ),
    ).toHaveLength(14)
    expect(
      renderedAllDecouplingCapacitors.filter(
        ({ footprint }) => footprint === "cap0201_nosilkscreen",
      ),
    ).toHaveLength(60)
    expect(
      renderedAllDecouplingCapacitors.filter(
        ({ footprint }) => footprint === "cap0402_nosilkscreen",
      ),
    ).toHaveLength(8)

    const countBy = <T extends string>(values: readonly T[]) =>
      Object.fromEntries(
        [...new Set(values)].map((value) => [
          value,
          values.filter((candidate) => candidate === value).length,
        ]),
      )
    expect(
      countBy(
        renderedAllDecouplingCapacitors.map(({ capacitance }) => capacitance),
      ),
    ).toEqual({
      "0.01uF": 1,
      "0.1uF": 14,
      "1uF": 44,
      "2.2uF": 1,
      "3.3uF": 1,
      "4.7uF": 2,
      "10uF": 5,
    })
    expect(
      countBy(renderedAllDecouplingCapacitors.map(({ priority }) => priority)),
    ).toEqual({ bulk: 13, high: 20, low: 6, medium: 23, required: 6 })

    expect(
      new Set(
        AM62L_DDR_DECOUPLING_CAPACITORS.filter(
          ({ priority }) => priority === "high",
        ).map(({ targetBall }) => targetBall),
      ).size,
    ).toBe(AM62L_VDDS_DDR_BALLS.length)
    expect(AM62L_DDR_DECOUPLING_CAPACITORS).toHaveLength(8)
    expect(
      AM62L_DDR_DECOUPLING_CAPACITORS.filter(
        ({ priority }) => priority === "high",
      ),
    ).toHaveLength(5)
    expect(
      AM62L_DDR_DECOUPLING_CAPACITORS.filter(
        ({ priority }) => priority === "medium",
      ),
    ).toHaveLength(3)

    for (const [
      index,
      capacitor,
    ] of renderedAllDecouplingCapacitors.entries()) {
      const courtyard = getCapCourtyardSize(
        capacitor.footprint,
        capacitor.pcbRotation,
      )
      if (capacitor.placement === "under") {
        expect(
          Math.abs(capacitor.pcbX) + courtyard.width / 2,
        ).toBeLessThanOrEqual(6.8)
        expect(
          Math.abs(capacitor.pcbY) + courtyard.height / 2,
        ).toBeLessThanOrEqual(6.8)
      }
      for (const other of renderedAllDecouplingCapacitors.slice(index + 1)) {
        const otherCourtyard = getCapCourtyardSize(
          other.footprint,
          other.pcbRotation,
        )
        const horizontalGap =
          Math.abs(capacitor.pcbX - other.pcbX) -
          (courtyard.width + otherCourtyard.width) / 2
        const verticalGap =
          Math.abs(capacitor.pcbY - other.pcbY) -
          (courtyard.height + otherCourtyard.height) / 2
        expect(Math.max(horizontalGap, verticalGap)).toBeGreaterThanOrEqual(
          0.05 - 1e-6,
        )
      }
    }

    const capacitanceInFarads: Record<string, number> = {
      "0.01uF": 0.01e-6,
      "0.1uF": 0.1e-6,
      "1uF": 1e-6,
      "2.2uF": 2.2e-6,
      "3.3uF": 3.3e-6,
      "4.7uF": 4.7e-6,
      "10uF": 10e-6,
    }
    for (const capacitor of renderedAllDecouplingCapacitors) {
      const sourceComponent = circuit.db.source_component.getWhere({
        name: capacitor.name,
      })!
      expect(sourceComponent.ftype).toBe("simple_capacitor")
      if (sourceComponent.ftype !== "simple_capacitor") {
        throw new Error(`Expected ${capacitor.name} to be a capacitor`)
      }
      expect(sourceComponent.capacitance).toBeCloseTo(
        capacitanceInFarads[capacitor.capacitance]!,
      )
      expect(sourceComponent.max_decoupling_trace_length).toBeCloseTo(
        capacitor.maxDecouplingTraceLength,
      )

      const pcbComponent = circuit.db.pcb_component.getWhere({
        source_component_id: sourceComponent.source_component_id,
      })!
      expect(pcbComponent.layer).toBe("bottom")
      expect(pcbComponent.center.x).toBeCloseTo(
        socPcbComponent.center.x + capacitor.pcbX,
      )
      expect(pcbComponent.center.y).toBeCloseTo(
        socPcbComponent.center.y + capacitor.pcbY,
      )
      const capacitorPads = circuit.db.pcb_smtpad
        .list()
        .filter((pad) => pad.pcb_component_id === pcbComponent.pcb_component_id)
      expect(capacitorPads).toHaveLength(2)
      expect(capacitorPads.every((pad) => pad.layer === "bottom")).toBe(true)

      const targetPort = circuit.db.source_port
        .list()
        .find(
          (port) =>
            port.source_component_id ===
              socSourceComponent.source_component_id &&
            port.port_hints?.includes(capacitor.targetBall),
        )
      expect(targetPort).toBeDefined()
      if (!targetPort) {
        throw new Error(`Missing AM62L power ball ${capacitor.targetBall}`)
      }
      expect(targetPort.should_have_decoupling_capacitor).toBe(true)
      const targetPcbPort = circuit.db.pcb_port.getWhere({
        source_port_id: targetPort.source_port_id,
      })!
      const targetPad = circuit.db.pcb_smtpad.getWhere({
        pcb_port_id: targetPcbPort.pcb_port_id,
      })!
      expect(targetPad.shape).toBe("circle")
      if (targetPad.shape !== "circle") {
        throw new Error(`Expected ${capacitor.targetBall} to be circular`)
      }
      const railTargetBalls = AM62L_TARGET_BALLS_BY_RAIL.get(
        capacitor.railNetName,
      )!
      const nearestRailBallDistance = Math.min(
        ...railTargetBalls.map((ballName) => {
          const railPort = circuit.db.source_port
            .list()
            .find(
              (port) =>
                port.source_component_id ===
                  socSourceComponent.source_component_id &&
                port.port_hints?.includes(ballName),
            )!
          const railPcbPort = circuit.db.pcb_port.getWhere({
            source_port_id: railPort.source_port_id,
          })!
          const railPad = circuit.db.pcb_smtpad.getWhere({
            pcb_port_id: railPcbPort.pcb_port_id,
          })!
          if (railPad.shape !== "circle") {
            throw new Error(`Expected ${ballName} to be circular`)
          }
          return Math.hypot(
            pcbComponent.center.x - railPad.x,
            pcbComponent.center.y - railPad.y,
          )
        }),
      )
      expect(nearestRailBallDistance).toBeLessThanOrEqual(
        capacitor.maxDecouplingTraceLength,
      )

      const directCapacitor = renderedDirectDecouplingCapacitors.find(
        ({ name }) => name === capacitor.name,
      )
      const powerTraceName = directCapacitor
        ? `${capacitor.name}_POWER_DROP`
        : `${capacitor.name}_VDD_DROP`
      const capacitorSourceTraces = [
        circuit.db.source_trace.getWhere({ name: powerTraceName }),
        circuit.db.source_trace.getWhere({
          name: `${capacitor.name}_GND_DROP`,
        }),
      ]
      expect(capacitorSourceTraces.every(Boolean)).toBe(true)
      expect(
        capacitorSourceTraces.every(
          (trace) => trace?.max_length === capacitor.maxDecouplingTraceLength,
        ),
      ).toBe(true)
      const positivePort = circuit.db.source_port.getWhere({
        source_component_id: sourceComponent.source_component_id,
        pin_number: 1,
      })!
      const groundPort = circuit.db.source_port.getWhere({
        source_component_id: sourceComponent.source_component_id,
        pin_number: 2,
      })!
      const railNet = circuit.db.source_net.getWhere({
        name: capacitor.railNetName,
      })!
      const groundNet = circuit.db.source_net.getWhere({ name: "GND" })!
      expect(capacitorSourceTraces[0]?.connected_source_port_ids).toEqual([
        positivePort.source_port_id,
      ])
      expect(capacitorSourceTraces[0]?.connected_source_net_ids).toEqual([
        railNet.source_net_id,
      ])
      expect(capacitorSourceTraces[1]?.connected_source_port_ids).toEqual([
        groundPort.source_port_id,
      ])
      expect(capacitorSourceTraces[1]?.connected_source_net_ids).toEqual([
        groundNet.source_net_id,
      ])
    }

    const expectedDecoupledTargetBalls = new Set([
      ...AM62L_VDD_CORE_BALLS,
      ...AM62L_VDDS_DDR_BALLS,
      ...AM62L_VDDA_1V8_BALLS,
      ...AM62L_SOC_DVDD3V3_BALLS,
      ...AM62L_SOC_DVDD1V8_BALLS,
      ...AM62L_VDDA_CORE_BALLS,
      ...AM62L_VPP_BALLS,
      ...AM62L_VDD_MMC1_SD_BALLS,
      ...AM62L_VDDSHV_SD_IO_BALLS,
      ...AM62L_SOC_VDD_RTC_BALLS,
      ...AM62L_SOC_VDDS_RTC_1V8_BALLS,
      ...AM62L_SPECIAL_CAP_BALLS.map(({ ballName }) => ballName),
    ])
    expect(expectedDecoupledTargetBalls.size).toBe(50)
    expect(
      new Set(
        renderedAllDecouplingCapacitors.map(({ targetBall }) => targetBall),
      ),
    ).toEqual(expectedDecoupledTargetBalls)
    for (const ballName of expectedDecoupledTargetBalls) {
      const targetPort = circuit.db.source_port
        .list()
        .find(
          (port) =>
            port.source_component_id ===
              socSourceComponent.source_component_id &&
            port.port_hints?.includes(ballName),
        )!
      const recommendedCapacitor =
        AM62L_DECOUPLING_CAPACITOR_BY_TARGET_BALL.get(ballName)!
      expect(targetPort.should_have_decoupling_capacitor).toBe(true)
      expect(targetPort.requires_power).toBe(
        !AM62L_SPECIAL_CAP_BALL_NAME_SET.has(ballName),
      )
      expect(targetPort.recommended_decoupling_capacitor_capacitance).toBe(
        recommendedCapacitor.capacitance,
      )
    }

    expect(AM62L_DIRECT_POWER_BALLS).toHaveLength(45)
    expect(AM62L_DIRECT_RAIL_NET_NAMES).toHaveLength(16)
    const expectedMembershipErrors: Array<{
      pcbComponentId: string
      pcbPortId: string
      railNetName: string
    }> = []
    for (const powerBall of AM62L_DIRECT_POWER_BALLS) {
      const membershipTrace = circuit.db.source_trace.getWhere({
        name: `U1_${powerBall.ballName}_PDN_MEMBERSHIP`,
      })!
      const railNet = circuit.db.source_net.getWhere({
        name: powerBall.railNetName,
      })!
      const targetPort = circuit.db.source_port
        .list()
        .find(
          (port) =>
            port.source_component_id ===
              socSourceComponent.source_component_id &&
            port.port_hints?.includes(powerBall.ballName),
        )!
      const targetPcbPort = circuit.db.pcb_port.getWhere({
        source_port_id: targetPort.source_port_id,
      })!
      expectedMembershipErrors.push({
        pcbComponentId: socPcbComponent.pcb_component_id,
        pcbPortId: targetPcbPort.pcb_port_id,
        railNetName: powerBall.railNetName,
      })
      expect(membershipTrace.connected_source_port_ids).toEqual([
        targetPort.source_port_id,
      ])
      expect(membershipTrace.connected_source_net_ids).toEqual([
        railNet.source_net_id,
      ])
      expect(
        circuit.db.pcb_trace
          .list()
          .filter(
            (pcbTrace) =>
              pcbTrace.source_trace_id === membershipTrace.source_trace_id,
          ),
      ).toEqual([])
    }
    // This fixture models the 16 non-DDR rails as source-only segmented-PDN
    // memberships. Assert the resulting diagnostics one-for-one so no real
    // unrouted port can hide behind that deliberate abstraction.
    const membershipErrors = circuit.db.pcb_port_not_connected_error.list()
    expect(membershipErrors).toHaveLength(expectedMembershipErrors.length)
    const membershipErrorsByPcbPortId = new Map(
      membershipErrors.map((error) => {
        expect(error.pcb_port_ids).toHaveLength(1)
        return [error.pcb_port_ids[0]!, error]
      }),
    )
    expect(membershipErrorsByPcbPortId.size).toBe(
      expectedMembershipErrors.length,
    )
    expect(new Set(membershipErrorsByPcbPortId.keys())).toEqual(
      new Set(expectedMembershipErrors.map(({ pcbPortId }) => pcbPortId)),
    )
    expect(
      new Set(
        membershipErrors.map(
          ({ pcb_port_not_connected_error_id }) =>
            pcb_port_not_connected_error_id,
        ),
      ).size,
    ).toBe(expectedMembershipErrors.length)
    for (const expectedError of expectedMembershipErrors) {
      const error = membershipErrorsByPcbPortId.get(expectedError.pcbPortId)!
      expect(error).toMatchObject({
        error_type: "pcb_port_not_connected_error",
        pcb_component_ids: [expectedError.pcbComponentId],
        pcb_port_ids: [expectedError.pcbPortId],
        type: "pcb_port_not_connected_error",
      })
      expect(error.message).toContain(`net [${expectedError.railNetName}]`)
    }

    const directPowerVias = renderedDirectDecouplingCapacitors.map(
      (capacitor) => {
        const railNet = circuit.db.source_net.getWhere({
          name: capacitor.railNetName,
        })!
        const expectedPosition = getDirectDecouplingViaPosition(
          capacitor,
          capacitor.powerViaOffset,
        )
        const matchingVias = circuit.db.pcb_via
          .list()
          .filter(
            (via) =>
              via.source_net_id === railNet.source_net_id &&
              Math.hypot(
                via.x - expectedPosition.x,
                via.y - expectedPosition.y,
              ) < 1e-6,
          )
        expect(matchingVias).toHaveLength(1)
        const powerVia = matchingVias[0]!
        expect(powerVia).toMatchObject({
          from_layer: "top",
          hole_diameter: 0.15,
          outer_diameter: 0.24,
          to_layer: "bottom",
        })
        expect(powerVia.layers).toEqual(getViaBoardLayers(8))
        return powerVia
      },
    )
    expect(directPowerVias).toHaveLength(60)
    const groundNet = circuit.db.source_net.getWhere({ name: "GND" })!
    const directGroundVias = renderedDirectDecouplingCapacitors.map(
      (capacitor) => {
        const expectedPosition = getDirectDecouplingViaPosition(
          capacitor,
          capacitor.groundViaOffset,
        )
        const matchingVias = circuit.db.pcb_via
          .list()
          .filter(
            (via) =>
              via.source_net_id === groundNet.source_net_id &&
              Math.hypot(
                via.x - expectedPosition.x,
                via.y - expectedPosition.y,
              ) < 1e-6,
          )
        expect(matchingVias).toHaveLength(1)
        return matchingVias[0]!
      },
    )
    expect(directGroundVias).toHaveLength(60)
    for (const via of directGroundVias) {
      expect(via.hole_diameter).toBeCloseTo(0.15)
      expect(via.outer_diameter).toBeCloseTo(0.24)
      expect(via.from_layer).toBe("top")
      expect(via.to_layer).toBe("bottom")
      expect(via.layers).toEqual(getViaBoardLayers(8))
    }
  }
  const minViaEdgeToPadEdgeClearance =
    pcbBoard.min_via_edge_to_pad_edge_clearance!
  expect(SOC_PLANE_DROPS).toHaveLength(102)
  expect(SOC_DDR_DECOUPLING_PLANE_DROPS).toHaveLength(16)
  expect(SOC_DIRECT_DECOUPLING_GROUND_MEMBERS).toHaveLength(60)
  expect(DRAM_PLANE_DROPS).toHaveLength(110)
  expect(expectedPlaneMembers).toHaveLength(includePowerPlaneFanout ? 288 : 0)
  expect(autoroutingPhaseIoStack).toHaveLength(3)
  expect(
    autoroutingPhaseIoStack.map(
      (phaseIo) => phaseIo.startSimpleRouteJson?.connections.length,
    ),
  ).toEqual([
    signalConnections.length + socPlaneDrops.length,
    signalConnections.length + dramPlaneDrops.length,
    signalConnections.length + decouplingPlaneDrops.length,
  ])
  for (const [fanoutPhaseIndex, fanoutPhase] of autoroutingPhaseIoStack
    .slice(0, 2)
    .entries()) {
    const fanoutInput = fanoutPhase.startSimpleRouteJson!
    const fanoutOutput = fanoutPhase.endSimpleRouteJson!
    if (includePowerPlaneFanout) {
      expect(fanoutInput.allowBlindAndBuriedVias).toBe(false)
      expect(fanoutInput.allowViaInPad).not.toBe(true)
    }
    const boundaryBuses =
      fanoutInput.buses?.filter((bus) => bus.termination?.type !== "plane") ??
      []
    expect(boundaryBuses).toHaveLength(fanoutBuses.length)
    const boundaryConnectionNames = new Set(
      boundaryBuses.flatMap((bus) => bus.connectionNames),
    )
    const phaseConnectionNames = new Set(
      fanoutInput.connections.map((connection) => connection.name),
    )
    const fanoutOutputTraces = (fanoutOutput.traces ?? []).filter(
      (trace) =>
        trace.connection_name !== undefined &&
        phaseConnectionNames.has(trace.connection_name),
    )
    const expectedPlaneDrops = planeDrops.filter(
      (drop) => drop.fanoutPhaseIndex === fanoutPhaseIndex,
    )
    const outputRouteVias = fanoutOutputTraces.flatMap((trace) =>
      trace.route.filter((routePoint) => routePoint.route_type === "via"),
    )
    expect(outputRouteVias).toHaveLength(
      signalConnections.length + expectedPlaneDrops.length,
    )
    if (includePowerPlaneFanout) {
      for (const routeVia of outputRouteVias) {
        expect(routeVia.layers).toEqual(getViaBoardLayers(8))
      }
    }
    const routedFanoutTraces = fanoutOutputTraces.filter(
      (trace) =>
        trace.connection_name !== undefined &&
        boundaryConnectionNames.has(trace.connection_name),
    )
    expect(routedFanoutTraces).toHaveLength(signalConnections.length)
    for (const trace of routedFanoutTraces) {
      expect(
        trace.route.filter((routePoint) => routePoint.route_type === "via"),
      ).toHaveLength(1)
    }
    for (const expectedBus of fanoutBuses) {
      const bus = fanoutPhase.startSimpleRouteJson?.buses?.find(
        (candidate) => candidate.busId === expectedBus.name,
      )
      expect(bus?.maxLengthSkew).toBe(expectedBus.maxLengthSkew)
      const connectionNames = new Set(bus?.connectionNames ?? [])
      const traceLengths = routedFanoutTraces
        .filter((trace) => connectionNames.has(trace.connection_name ?? ""))
        .map(getPlanarTraceLength)
      expect(traceLengths).toHaveLength(expectedBus.connections.length)
      if (expectedBus.maxLengthSkew !== undefined) {
        expect(
          Math.max(...traceLengths) - Math.min(...traceLengths),
        ).toBeLessThanOrEqual(expectedBus.maxLengthSkew + 1e-6)
      }
    }
    if (includePowerPlaneFanout) {
      const clockBus = boundaryBuses.find((bus) => bus.busId === "DDR_CLOCK")
      expect(clockBus?.connectionNames).toHaveLength(
        DDR_CLOCK_CONNECTIONS.length,
      )
      const clockConnectionNames = clockBus?.connectionNames
      if (!clockConnectionNames || clockConnectionNames.length !== 2) {
        throw new Error("Expected two DDR_CLOCK fanout connections")
      }
      const dqs0Bus = boundaryBuses.find((bus) => bus.busId === "DDR_DQS0")
      expect(dqs0Bus?.connectionNames).toHaveLength(DDR_DQS0_CONNECTIONS.length)
      const dqs0ConnectionNames = dqs0Bus?.connectionNames
      if (!dqs0ConnectionNames || dqs0ConnectionNames.length !== 2) {
        throw new Error("Expected two DDR_DQS0 fanout connections")
      }
      const dqs1Bus = boundaryBuses.find((bus) => bus.busId === "DDR_DQS1")
      expect(dqs1Bus?.connectionNames).toHaveLength(DDR_DQS1_CONNECTIONS.length)
      const dqs1ConnectionNames = dqs1Bus?.connectionNames
      if (!dqs1ConnectionNames || dqs1ConnectionNames.length !== 2) {
        throw new Error("Expected two DDR_DQS1 fanout connections")
      }
      const resetBus = boundaryBuses.find((bus) => bus.busId === "DDR_RESET")
      expect(resetBus?.connectionNames).toHaveLength(1)
      const resetSourceTrace = circuit.db.source_trace.getWhere({
        name: DDR_RESET_CONNECTION.traceName,
      })
      if (!resetSourceTrace) throw new Error("Missing RESET_n source trace")
      const resetPhaseConnection = fanoutInput.connections.find(
        (connection) =>
          connection.source_trace_id === resetSourceTrace.source_trace_id,
      )
      expect(resetPhaseConnection).toBeDefined()
      if (!resetPhaseConnection) {
        throw new Error("Missing RESET_n fanout phase connection")
      }
      expect(resetBus?.connectionNames).toEqual([resetPhaseConnection.name])
      const dmi0Bus = boundaryBuses.find((bus) => bus.busId === "DDR_DMI0")
      expect(dmi0Bus?.connectionNames).toHaveLength(1)
      const dmi0SourceTrace = circuit.db.source_trace.getWhere({
        name: DDR_DMI0_CONNECTION.traceName,
      })
      if (!dmi0SourceTrace) throw new Error("Missing DMI0 source trace")
      const dmi0PhaseConnection = fanoutInput.connections.find(
        (connection) =>
          connection.source_trace_id === dmi0SourceTrace.source_trace_id,
      )
      expect(dmi0PhaseConnection).toBeDefined()
      if (!dmi0PhaseConnection) {
        throw new Error("Missing DMI0 fanout phase connection")
      }
      expect(dmi0Bus?.connectionNames).toEqual([dmi0PhaseConnection.name])
      const dmi1Bus = boundaryBuses.find((bus) => bus.busId === "DDR_DMI1")
      expect(dmi1Bus?.connectionNames).toHaveLength(1)
      const dmi1SourceTrace = circuit.db.source_trace.getWhere({
        name: DDR_DMI1_CONNECTION.traceName,
      })
      if (!dmi1SourceTrace) throw new Error("Missing DMI1 source trace")
      const dmi1PhaseConnection = fanoutInput.connections.find(
        (connection) =>
          connection.source_trace_id === dmi1SourceTrace.source_trace_id,
      )
      expect(dmi1PhaseConnection).toBeDefined()
      if (!dmi1PhaseConnection) {
        throw new Error("Missing DMI1 fanout phase connection")
      }
      expect(dmi1Bus?.connectionNames).toEqual([dmi1PhaseConnection.name])
      expect(fanoutInput.differentialPairs).toEqual([
        {
          connectionNames: [clockConnectionNames[0]!, clockConnectionNames[1]!],
          lengthTolerance: CLOCK_MAX_FANOUT_SKEW,
        },
        {
          connectionNames: [dqs0ConnectionNames[0]!, dqs0ConnectionNames[1]!],
          lengthTolerance: DQS0_MAX_FANOUT_SKEW,
        },
        {
          connectionNames: [dqs1ConnectionNames[0]!, dqs1ConnectionNames[1]!],
          lengthTolerance: DQS1_MAX_FANOUT_SKEW,
        },
      ])
    }
    const planeBuses =
      fanoutInput.buses?.filter((bus) => bus.termination?.type === "plane") ??
      []
    expect(planeBuses.every((bus) => bus.connectionNames.length === 1)).toBe(
      true,
    )
    expect(
      planeBuses
        .map((bus) => ({
          busId: bus.busId,
          layer:
            bus.termination?.type === "plane"
              ? bus.termination.layer
              : undefined,
        }))
        .toSorted((first, second) => first.busId.localeCompare(second.busId)),
    ).toEqual(
      expectedPlaneDrops
        .map((drop) => ({ busId: drop.traceName, layer: drop.layer }))
        .toSorted((first, second) => first.busId.localeCompare(second.busId)),
    )
  }
  const socFanoutPhase = autoroutingPhaseIoStack[0]!
  const socFanoutInput = socFanoutPhase.startSimpleRouteJson!
  const socFanoutCenterY =
    (socFanoutInput.bounds.minY + socFanoutInput.bounds.maxY) / 2
  for (const { name: busId, connections } of fanoutBuses.filter(
    ({ name }) => name === "DDR_BYTE0" || name === "DDR_BYTE1",
  )) {
    const expectedYSign = busId === "DDR_BYTE0" ? 1 : -1
    const bus = socFanoutInput.buses?.find((bus) => bus.busId === busId)
    expect(bus?.connectionNames).toHaveLength(connections.length)
    const connectionNames = new Set(bus?.connectionNames ?? [])
    const exitPoints = (socFanoutPhase.endSimpleRouteJson?.traces ?? [])
      .filter((trace) => connectionNames.has(trace.connection_name ?? ""))
      .map((trace) =>
        trace.route.findLast((routePoint) => routePoint.route_type === "wire"),
      )
    expect(exitPoints).toHaveLength(connections.length)
    for (const exitPoint of exitPoints) {
      expect(exitPoint).toBeDefined()
      if (!exitPoint) throw new Error(`Missing ${busId} fanout exit point`)
      expect(exitPoint.x).toBeCloseTo(socFanoutInput.bounds.maxX)
      expect((exitPoint.y - socFanoutCenterY) * expectedYSign).toBeGreaterThan(
        0,
      )
      expect(exitPoint.y).toBeGreaterThan(socFanoutInput.bounds.minY)
      expect(exitPoint.y).toBeLessThan(socFanoutInput.bounds.maxY)
    }
  }
  if (includePowerPlaneFanout) {
    const addrCtrlBus = socFanoutInput.buses?.find(
      (bus) => bus.busId === "DDR_ADDR_CTRL",
    )
    expect(addrCtrlBus?.connectionNames).toHaveLength(
      DDR_ADDR_CTRL_CONNECTIONS.length,
    )
    const addrCtrlConnectionNames = new Set(addrCtrlBus?.connectionNames ?? [])
    const addrCtrlExitPoints = (socFanoutPhase.endSimpleRouteJson?.traces ?? [])
      .filter((trace) =>
        addrCtrlConnectionNames.has(trace.connection_name ?? ""),
      )
      .map((trace) =>
        trace.route.findLast((routePoint) => routePoint.route_type === "wire"),
      )
    expect(addrCtrlExitPoints).toHaveLength(DDR_ADDR_CTRL_CONNECTIONS.length)
    const addrCtrlExitYCoordinates: number[] = []
    for (const exitPoint of addrCtrlExitPoints) {
      expect(exitPoint).toBeDefined()
      if (!exitPoint) throw new Error("Missing DDR_ADDR_CTRL fanout exit point")
      expect(exitPoint.x).toBeCloseTo(socFanoutInput.bounds.maxX)
      expect(exitPoint.y).toBeGreaterThan(socFanoutInput.bounds.minY)
      expect(exitPoint.y).toBeLessThan(socFanoutInput.bounds.maxY)
      addrCtrlExitYCoordinates.push(exitPoint.y)
    }
    expect(Math.min(...addrCtrlExitYCoordinates)).toBeGreaterThan(
      socFanoutInput.bounds.minY,
    )
    expect(Math.max(...addrCtrlExitYCoordinates)).toBeLessThan(
      socFanoutInput.bounds.maxY,
    )
    const clockBus = socFanoutInput.buses?.find(
      (bus) => bus.busId === "DDR_CLOCK",
    )
    expect(clockBus?.connectionNames).toHaveLength(DDR_CLOCK_CONNECTIONS.length)
    const clockConnectionNames = new Set(clockBus?.connectionNames ?? [])
    const clockExitPoints = (socFanoutPhase.endSimpleRouteJson?.traces ?? [])
      .filter((trace) => clockConnectionNames.has(trace.connection_name ?? ""))
      .map((trace) =>
        trace.route.findLast((routePoint) => routePoint.route_type === "wire"),
      )
    expect(clockExitPoints).toHaveLength(DDR_CLOCK_CONNECTIONS.length)
    for (const exitPoint of clockExitPoints) {
      expect(exitPoint).toBeDefined()
      if (!exitPoint) throw new Error("Missing DDR_CLOCK fanout exit point")
      expect(exitPoint.x).toBeCloseTo(socFanoutInput.bounds.maxX)
      expect(exitPoint.layer).toBe("inner5")
      expect(exitPoint.y).toBeGreaterThan(socFanoutInput.bounds.minY)
      expect(exitPoint.y).toBeLessThan(socFanoutInput.bounds.maxY)
    }
    const dqs0Bus = socFanoutInput.buses?.find(
      (bus) => bus.busId === "DDR_DQS0",
    )
    expect(dqs0Bus?.connectionNames).toHaveLength(DDR_DQS0_CONNECTIONS.length)
    const dqs0ConnectionNames = new Set(dqs0Bus?.connectionNames ?? [])
    const dqs0ExitPoints = (socFanoutPhase.endSimpleRouteJson?.traces ?? [])
      .filter((trace) => dqs0ConnectionNames.has(trace.connection_name ?? ""))
      .map((trace) =>
        trace.route.findLast((routePoint) => routePoint.route_type === "wire"),
      )
    expect(dqs0ExitPoints).toHaveLength(DDR_DQS0_CONNECTIONS.length)
    for (const exitPoint of dqs0ExitPoints) {
      expect(exitPoint).toBeDefined()
      if (!exitPoint) throw new Error("Missing DDR_DQS0 fanout exit point")
      expect(exitPoint.x).toBeCloseTo(socFanoutInput.bounds.maxX)
      expect(exitPoint.layer).toBe("inner5")
      expect(exitPoint.y).toBeGreaterThan(socFanoutCenterY)
      expect(exitPoint.y).toBeLessThan(socFanoutInput.bounds.maxY)
    }
    const dqs1Bus = socFanoutInput.buses?.find(
      (bus) => bus.busId === "DDR_DQS1",
    )
    expect(dqs1Bus?.connectionNames).toHaveLength(DDR_DQS1_CONNECTIONS.length)
    const dqs1ConnectionNames = new Set(dqs1Bus?.connectionNames ?? [])
    const dqs1ExitPoints = (socFanoutPhase.endSimpleRouteJson?.traces ?? [])
      .filter((trace) => dqs1ConnectionNames.has(trace.connection_name ?? ""))
      .map((trace) =>
        trace.route.findLast((routePoint) => routePoint.route_type === "wire"),
      )
    expect(dqs1ExitPoints).toHaveLength(DDR_DQS1_CONNECTIONS.length)
    for (const exitPoint of dqs1ExitPoints) {
      expect(exitPoint).toBeDefined()
      if (!exitPoint) throw new Error("Missing DDR_DQS1 fanout exit point")
      expect(exitPoint.x).toBeCloseTo(socFanoutInput.bounds.maxX)
      expect(exitPoint.layer).toBe("inner5")
      expect(exitPoint.y).toBeGreaterThan(socFanoutInput.bounds.minY)
      expect(exitPoint.y).toBeLessThan(socFanoutInput.bounds.maxY)
    }
    expect(
      Math.max(...dqs1ExitPoints.map((exitPoint) => exitPoint!.y)),
    ).toBeLessThan(Math.min(...dqs0ExitPoints.map((exitPoint) => exitPoint!.y)))
    const resetBus = socFanoutInput.buses?.find(
      (bus) => bus.busId === "DDR_RESET",
    )
    expect(resetBus?.connectionNames).toHaveLength(1)
    const resetConnectionNames = new Set(resetBus?.connectionNames ?? [])
    const resetExitPoints = (socFanoutPhase.endSimpleRouteJson?.traces ?? [])
      .filter((trace) => resetConnectionNames.has(trace.connection_name ?? ""))
      .map((trace) =>
        trace.route.findLast((routePoint) => routePoint.route_type === "wire"),
      )
    expect(resetExitPoints).toHaveLength(1)
    const resetExitPoint = resetExitPoints[0]
    if (!resetExitPoint) throw new Error("Missing DDR_RESET fanout exit point")
    expect(resetExitPoint.x).toBeCloseTo(socFanoutInput.bounds.maxX)
    expect(resetExitPoint.layer).toBe("inner6")
    expect(resetExitPoint.y).toBeGreaterThan(socFanoutInput.bounds.minY)
    expect(resetExitPoint.y).toBeLessThan(socFanoutInput.bounds.maxY)

    const dmi0Bus = socFanoutInput.buses?.find(
      (bus) => bus.busId === "DDR_DMI0",
    )
    expect(dmi0Bus?.connectionNames).toHaveLength(1)
    const dmi0ConnectionName = dmi0Bus?.connectionNames[0]
    if (!dmi0ConnectionName) {
      throw new Error("Missing SoC DDR_DMI0 fanout connection")
    }
    const dmi0Trace = socFanoutPhase.endSimpleRouteJson?.traces?.find(
      (trace) => trace.connection_name === dmi0ConnectionName,
    )
    const dmi0ExitPoint = dmi0Trace?.route.findLast(
      (routePoint) => routePoint.route_type === "wire",
    )
    if (!dmi0ExitPoint) {
      throw new Error("Missing SoC DDR_DMI0 fanout exit point")
    }
    expect(dmi0ExitPoint.x).toBeCloseTo(socFanoutInput.bounds.maxX)
    expect(dmi0ExitPoint.layer).toBe("inner5")
    expect(dmi0ExitPoint.y).toBeGreaterThan(socFanoutCenterY)
    expect(dmi0ExitPoint.y).toBeLessThan(socFanoutInput.bounds.maxY)

    const dmi1Bus = socFanoutInput.buses?.find(
      (bus) => bus.busId === "DDR_DMI1",
    )
    expect(dmi1Bus?.connectionNames).toHaveLength(1)
    const dmi1ConnectionName = dmi1Bus?.connectionNames[0]
    if (!dmi1ConnectionName) {
      throw new Error("Missing SoC DDR_DMI1 fanout connection")
    }
    const dmi1Trace = socFanoutPhase.endSimpleRouteJson?.traces?.find(
      (trace) => trace.connection_name === dmi1ConnectionName,
    )
    const dmi1ExitPoint = dmi1Trace?.route.findLast(
      (routePoint) => routePoint.route_type === "wire",
    )
    if (!dmi1ExitPoint) {
      throw new Error("Missing SoC DDR_DMI1 fanout exit point")
    }
    expect(dmi1ExitPoint.x).toBeCloseTo(socFanoutInput.bounds.maxX)
    expect(dmi1ExitPoint.layer).toBe("inner5")
    expect(dmi1ExitPoint.y).toBeGreaterThan(socFanoutInput.bounds.minY)
    expect(dmi1ExitPoint.y).toBeLessThan(socFanoutCenterY)

    const dramFanoutPhase = autoroutingPhaseIoStack[1]!
    const dramFanoutInput = dramFanoutPhase.startSimpleRouteJson!
    const dramResetBus = dramFanoutInput.buses?.find(
      (bus) => bus.busId === "DDR_RESET",
    )
    expect(dramResetBus?.connectionNames).toHaveLength(1)
    const dramResetConnectionName = dramResetBus?.connectionNames[0]
    if (!dramResetConnectionName) {
      throw new Error("Missing DRAM DDR_RESET fanout connection")
    }
    const dramResetTrace = dramFanoutPhase.endSimpleRouteJson?.traces?.find(
      (trace) => trace.connection_name === dramResetConnectionName,
    )
    const dramResetExitPoint = dramResetTrace?.route.findLast(
      (routePoint) => routePoint.route_type === "wire",
    )
    if (!dramResetExitPoint) {
      throw new Error("Missing DRAM DDR_RESET fanout exit point")
    }
    const dramFanoutCenterY =
      (dramFanoutInput.bounds.minY + dramFanoutInput.bounds.maxY) / 2
    expect(dramResetExitPoint.x).toBeCloseTo(dramFanoutInput.bounds.minX)
    expect(dramResetExitPoint.layer).toBe("inner6")
    expect(dramResetExitPoint.y).toBeGreaterThan(dramFanoutCenterY)
    expect(dramResetExitPoint.y).toBeLessThan(dramFanoutInput.bounds.maxY)

    const dramDmi0Bus = dramFanoutInput.buses?.find(
      (bus) => bus.busId === "DDR_DMI0",
    )
    expect(dramDmi0Bus?.connectionNames).toHaveLength(1)
    const dramDmi0ConnectionName = dramDmi0Bus?.connectionNames[0]
    if (!dramDmi0ConnectionName) {
      throw new Error("Missing DRAM DDR_DMI0 fanout connection")
    }
    const dramDmi0Trace = dramFanoutPhase.endSimpleRouteJson?.traces?.find(
      (trace) => trace.connection_name === dramDmi0ConnectionName,
    )
    const dramDmi0ExitPoint = dramDmi0Trace?.route.findLast(
      (routePoint) => routePoint.route_type === "wire",
    )
    if (!dramDmi0ExitPoint) {
      throw new Error("Missing DRAM DDR_DMI0 fanout exit point")
    }
    expect(dramDmi0ExitPoint.x).toBeCloseTo(dramFanoutInput.bounds.minX)
    expect(dramDmi0ExitPoint.layer).toBe("inner5")
    expect(dramDmi0ExitPoint.y).toBeGreaterThan(dramFanoutCenterY)
    expect(dramDmi0ExitPoint.y).toBeLessThan(dramFanoutInput.bounds.maxY)

    const dramDmi1Bus = dramFanoutInput.buses?.find(
      (bus) => bus.busId === "DDR_DMI1",
    )
    expect(dramDmi1Bus?.connectionNames).toHaveLength(1)
    const dramDmi1ConnectionName = dramDmi1Bus?.connectionNames[0]
    if (!dramDmi1ConnectionName) {
      throw new Error("Missing DRAM DDR_DMI1 fanout connection")
    }
    const dramDmi1Trace = dramFanoutPhase.endSimpleRouteJson?.traces?.find(
      (trace) => trace.connection_name === dramDmi1ConnectionName,
    )
    const dramDmi1ExitPoint = dramDmi1Trace?.route.findLast(
      (routePoint) => routePoint.route_type === "wire",
    )
    if (!dramDmi1ExitPoint) {
      throw new Error("Missing DRAM DDR_DMI1 fanout exit point")
    }
    expect(dramDmi1ExitPoint.x).toBeCloseTo(dramFanoutInput.bounds.minX)
    expect(dramDmi1ExitPoint.layer).toBe("inner5")
    expect(dramDmi1ExitPoint.y).toBeGreaterThanOrEqual(
      dramFanoutInput.bounds.minY,
    )
    expect(dramDmi1ExitPoint.y).toBeLessThan(dramFanoutCenterY)
    expect(dramDmi1ExitPoint.y).toBeLessThan(dramFanoutInput.bounds.maxY)

    const dramDqs0Bus = dramFanoutInput.buses?.find(
      (bus) => bus.busId === "DDR_DQS0",
    )
    expect(dramDqs0Bus?.connectionNames).toHaveLength(
      DDR_DQS0_CONNECTIONS.length,
    )
    const dramDqs0ConnectionNames = new Set(dramDqs0Bus?.connectionNames ?? [])
    const dramDqs0ExitPoints = (
      dramFanoutPhase.endSimpleRouteJson?.traces ?? []
    )
      .filter((trace) =>
        dramDqs0ConnectionNames.has(trace.connection_name ?? ""),
      )
      .map((trace) =>
        trace.route.findLast((routePoint) => routePoint.route_type === "wire"),
      )
    expect(dramDqs0ExitPoints).toHaveLength(DDR_DQS0_CONNECTIONS.length)
    for (const exitPoint of dramDqs0ExitPoints) {
      expect(exitPoint).toBeDefined()
      if (!exitPoint) throw new Error("Missing DRAM DDR_DQS0 fanout exit point")
      expect(exitPoint.x).toBeCloseTo(dramFanoutInput.bounds.minX)
      expect(exitPoint.layer).toBe("inner5")
      expect(exitPoint.y).toBeGreaterThan(dramFanoutCenterY)
      expect(exitPoint.y).toBeLessThan(dramFanoutInput.bounds.maxY)
    }

    const dramDqs1Bus = dramFanoutInput.buses?.find(
      (bus) => bus.busId === "DDR_DQS1",
    )
    expect(dramDqs1Bus?.connectionNames).toHaveLength(
      DDR_DQS1_CONNECTIONS.length,
    )
    const dramDqs1ConnectionNames = new Set(dramDqs1Bus?.connectionNames ?? [])
    const dramDqs1ExitPoints = (
      dramFanoutPhase.endSimpleRouteJson?.traces ?? []
    )
      .filter((trace) =>
        dramDqs1ConnectionNames.has(trace.connection_name ?? ""),
      )
      .map((trace) =>
        trace.route.findLast((routePoint) => routePoint.route_type === "wire"),
      )
    expect(dramDqs1ExitPoints).toHaveLength(DDR_DQS1_CONNECTIONS.length)
    for (const exitPoint of dramDqs1ExitPoints) {
      expect(exitPoint).toBeDefined()
      if (!exitPoint) throw new Error("Missing DRAM DDR_DQS1 fanout exit point")
      expect(exitPoint.x).toBeCloseTo(dramFanoutInput.bounds.minX)
      expect(exitPoint.layer).toBe("inner5")
      expect(exitPoint.y).toBeGreaterThan(dramFanoutInput.bounds.minY)
      expect(exitPoint.y).toBeLessThan(dramFanoutInput.bounds.maxY)
    }
    expect(
      Math.max(...dramDqs1ExitPoints.map((exitPoint) => exitPoint!.y)),
    ).toBeLessThan(
      Math.min(...dramDqs0ExitPoints.map((exitPoint) => exitPoint!.y)),
    )
  }
  expect(autoroutingPhaseIoStack[2]?.startSimpleRouteJson?.traces).toHaveLength(
    signalConnections.length * 2 + planeDrops.length,
  )
  const globalPhaseInput = autoroutingPhaseIoStack[2]!.startSimpleRouteJson!
  const signalGlobalConnections = globalPhaseInput.connections.filter(
    (connection) => connection.pointsToConnect.length === 2,
  )
  const decouplingGlobalConnections = globalPhaseInput.connections.filter(
    (connection) => connection.pointsToConnect.length === 1,
  )
  expect(signalGlobalConnections).toHaveLength(signalConnections.length)
  expect(decouplingGlobalConnections).toHaveLength(decouplingPlaneDrops.length)
  if (!useProductionGlobalAutorouter) {
    expect(
      getStraightLineWindingConflicts({
        ...globalPhaseInput,
        connections: signalGlobalConnections,
      }),
    ).toEqual([])
  }
  if (includePowerPlaneFanout) {
    const clockGlobalConnectionNames = clockTraceNames.map((traceName) => {
      const sourceTrace = circuit.db.source_trace.getWhere({ name: traceName })
      if (!sourceTrace) {
        throw new Error(`Missing source trace ${traceName}`)
      }
      const globalConnection = globalPhaseInput.connections.find(
        (connection) =>
          connection.source_trace_id === sourceTrace.source_trace_id,
      )
      if (!globalConnection) {
        throw new Error(`Missing global connection for ${traceName}`)
      }
      return globalConnection.name
    }) as [string, string]
    const dqs0GlobalConnectionNames = dqs0TraceNames.map((traceName) => {
      const sourceTrace = circuit.db.source_trace.getWhere({ name: traceName })
      if (!sourceTrace) {
        throw new Error(`Missing source trace ${traceName}`)
      }
      const globalConnection = globalPhaseInput.connections.find(
        (connection) =>
          connection.source_trace_id === sourceTrace.source_trace_id,
      )
      if (!globalConnection) {
        throw new Error(`Missing global connection for ${traceName}`)
      }
      return globalConnection.name
    }) as [string, string]
    const dqs1GlobalConnectionNames = dqs1TraceNames.map((traceName) => {
      const sourceTrace = circuit.db.source_trace.getWhere({ name: traceName })
      if (!sourceTrace) {
        throw new Error(`Missing source trace ${traceName}`)
      }
      const globalConnection = globalPhaseInput.connections.find(
        (connection) =>
          connection.source_trace_id === sourceTrace.source_trace_id,
      )
      if (!globalConnection) {
        throw new Error(`Missing global connection for ${traceName}`)
      }
      return globalConnection.name
    }) as [string, string]
    expect(globalPhaseInput.differentialPairs).toEqual([
      {
        connectionNames: clockGlobalConnectionNames,
        lengthTolerance: CLOCK_MAX_FANOUT_SKEW,
      },
      {
        connectionNames: dqs0GlobalConnectionNames,
        lengthTolerance: DQS0_MAX_FANOUT_SKEW,
      },
      {
        connectionNames: dqs1GlobalConnectionNames,
        lengthTolerance: DQS1_MAX_FANOUT_SKEW,
      },
    ])
  }
  const sourceKeepouts = globalPhaseInput.obstacles.filter(
    (obstacle) =>
      obstacle.isFanoutSourceKeepout === true &&
      obstacle.componentId !== undefined,
  )
  expect(sourceKeepouts).toHaveLength(2)
  const completedSourceComponentIds = new Set(
    sourceKeepouts.flatMap((obstacle) =>
      obstacle.componentId === undefined ? [] : [obstacle.componentId],
    ),
  )
  expect(
    globalPhaseInput.obstacles.filter(
      (obstacle) =>
        obstacle.componentId &&
        completedSourceComponentIds.has(obstacle.componentId) &&
        !obstacle.isFanoutSourceKeepout,
    ),
  ).toHaveLength(0)
  const socFanoutGroup = circuit.db.pcb_group.getWhere({ name: "SOC_FANOUT" })!
  const dramFanoutGroup = circuit.db.pcb_group.getWhere({
    name: "DRAM_FANOUT",
  })!
  const horizontalFanoutGap =
    dramFanoutGroup.center.x -
    dramFanoutGroup.width! / 2 -
    (socFanoutGroup.center.x + socFanoutGroup.width! / 2)
  expect(horizontalFanoutGap).toBeGreaterThanOrEqual(0.50256 - 1e-6)

  if (includePowerPlaneFanout) {
    const copperPours = circuit.db.pcb_copper_pour.list()
    for (const planeDrop of routedPlaneDrops) {
      const sourceComponent = circuit.db.source_component.getWhere({
        name: planeDrop.componentName,
      })!
      const sourcePort = circuit.db.source_port
        .list()
        .find(
          (port) =>
            port.source_component_id === sourceComponent.source_component_id &&
            port.pin_number === planeDrop.pinNumber,
        )
      expect(sourcePort).toBeDefined()
      if (!sourcePort) {
        throw new Error(
          `Missing ${planeDrop.componentName} ${planeDrop.ballName}/${planeDrop.pinSignal}`,
        )
      }
      expect(sourcePort.port_hints).toEqual(
        expect.arrayContaining([
          `pin${planeDrop.pinNumber}`,
          planeDrop.ballName,
          planeDrop.pinSignal,
        ]),
      )
      const sourceTrace = circuit.db.source_trace.getWhere({
        name: planeDrop.traceName,
      })!
      const expectedNet = circuit.db.source_net.getWhere({
        name: planeDrop.netName,
      })!
      expect(sourceTrace.connected_source_port_ids).toEqual([
        sourcePort.source_port_id,
      ])
      expect(sourceTrace.connected_source_net_ids).toEqual([
        expectedNet.source_net_id,
      ])
      expect(sourcePort.subcircuit_connectivity_map_key).toBe(
        expectedNet.subcircuit_connectivity_map_key,
      )
      expect(sourceTrace.subcircuit_connectivity_map_key).toBe(
        expectedNet.subcircuit_connectivity_map_key,
      )
      const matchingPcbTraces = circuit.db.pcb_trace
        .list()
        .filter(
          (pcbTrace) =>
            pcbTrace.source_trace_id === sourceTrace.source_trace_id,
        )
      expect(matchingPcbTraces).toHaveLength(1)
      const routeVias = matchingPcbTraces[0]!.route.filter(
        (routePoint) => routePoint.route_type === "via",
      )
      expect(routeVias).toHaveLength(1)
      if (planeDrop.fromLayer === "top") {
        expect(
          getPlanarRouteLength(matchingPcbTraces[0]!.route),
        ).toBeGreaterThan(0)
      } else {
        const padWire = matchingPcbTraces[0]!.route.find(
          (routePoint) => routePoint.route_type === "wire",
        )
        expect(padWire).toBeDefined()
        if (!padWire) {
          throw new Error(`Missing pad wire for ${planeDrop.traceName}`)
        }
        const padToViaLength = Math.hypot(
          routeVias[0]!.x - padWire.x,
          routeVias[0]!.y - padWire.y,
        )
        expect(padToViaLength).toBeGreaterThan(0)
        expect(padToViaLength).toBeLessThanOrEqual(
          AM62L_DDR_MAX_DECOUPLING_DISTANCE,
        )
      }
      expect(routeVias[0]).toMatchObject({
        from_layer: planeDrop.fromLayer,
        to_layer: planeDrop.layer,
      })
      const pcbTraceIds = new Set(
        matchingPcbTraces.map((pcbTrace) => pcbTrace.pcb_trace_id),
      )
      const matchingVias = circuit.db.pcb_via
        .list()
        .filter(
          (via) =>
            via.pcb_trace_id !== undefined && pcbTraceIds.has(via.pcb_trace_id),
        )
      expect(matchingVias).toHaveLength(1)
      const matchingVia = matchingVias[0]!
      expect(matchingVia.layers).toEqual(getViaBoardLayers(8))
      expect(matchingVia.from_layer).toBe(planeDrop.fromLayer)
      expect(matchingVias[0]?.to_layer).toBe(planeDrop.layer)
      expect(matchingVia.subcircuit_connectivity_map_key).toBe(
        expectedNet.subcircuit_connectivity_map_key,
      )
      const pcbPort = circuit.db.pcb_port.getWhere({
        source_port_id: sourcePort.source_port_id,
      })!
      const sourcePads = circuit.db.pcb_smtpad
        .list()
        .filter((pad) => pad.pcb_port_id === pcbPort.pcb_port_id)
      expect(sourcePads).toHaveLength(1)
      const sourcePad = sourcePads[0]!
      expect(sourcePad.layer).toBe(planeDrop.fromLayer)
      if (planeDrop.fromLayer === "top") {
        expect(sourcePad.shape).toBe("circle")
        if (sourcePad.shape !== "circle") {
          throw new Error(
            `Expected a circular BGA pad for ${planeDrop.traceName}`,
          )
        }
        const viaToSourcePadEdgeClearance =
          Math.hypot(matchingVia.x - sourcePad.x, matchingVia.y - sourcePad.y) -
          matchingVia.outer_diameter / 2 -
          sourcePad.radius
        expect(viaToSourcePadEdgeClearance).toBeGreaterThanOrEqual(
          minViaEdgeToPadEdgeClearance - 1e-6,
        )
      } else {
        expect(sourcePad.shape).toBe("rect")
      }
      const matchingPour = copperPours.find(
        (pour) =>
          pour.layer === planeDrop.layer &&
          pour.source_net_id === expectedNet.source_net_id,
      )
      expect(matchingPour).toBeDefined()
    }

    const planeNetNames = ["GND", LPDDR4_POWER_NET, LPDDR4_VDD1_NET] as const
    const planeConnectedComponentNames = [
      "U1",
      "U2",
      ...renderedAllDecouplingCapacitors.map(({ name }) => name),
    ]
    const sourceComponentById = new Map(
      planeConnectedComponentNames.map((componentName) => {
        const component = circuit.db.source_component.getWhere({
          name: componentName,
        })!
        return [component.source_component_id, component] as const
      }),
    )
    const planeNetByConnectivityKey = new Map(
      planeNetNames.map((netName) => {
        const net = circuit.db.source_net.getWhere({ name: netName })!
        return [net.subcircuit_connectivity_map_key, net] as const
      }),
    )
    expect(
      circuit.db.source_port
        .list()
        .flatMap((port) => {
          if (port.source_component_id === undefined) return []
          const component = sourceComponentById.get(port.source_component_id)
          const net = planeNetByConnectivityKey.get(
            port.subcircuit_connectivity_map_key,
          )
          if (!component || !net) return []
          return [
            {
              componentName: component.name,
              netName: net.name,
              pinNumber: port.pin_number,
            },
          ]
        })
        .toSorted((first, second) =>
          `${first.componentName}:${first.pinNumber}`.localeCompare(
            `${second.componentName}:${second.pinNumber}`,
          ),
        ),
    ).toEqual(
      [
        ...expectedPlaneMembers,
        ...renderedDirectDecouplingCapacitors.flatMap((capacitor) =>
          planeNetNames.includes(
            capacitor.railNetName as (typeof planeNetNames)[number],
          )
            ? [
                {
                  componentName: capacitor.name,
                  netName: capacitor.railNetName,
                  pinNumber: 1,
                },
              ]
            : [],
        ),
        ...AM62L_DIRECT_POWER_BALLS.flatMap((powerBall) =>
          planeNetNames.includes(
            powerBall.railNetName as (typeof planeNetNames)[number],
          )
            ? [
                {
                  componentName: "U1",
                  netName: powerBall.railNetName,
                  pinNumber: powerBall.pinNumber,
                },
              ]
            : [],
        ),
      ]
        .map((drop) => ({
          componentName: drop.componentName,
          netName: drop.netName,
          pinNumber: drop.pinNumber,
        }))
        .toSorted((first, second) =>
          `${first.componentName}:${first.pinNumber}`.localeCompare(
            `${second.componentName}:${second.pinNumber}`,
          ),
        ),
    )
  }

  const ddrTraceNames = new Set(
    signalConnections.map(({ traceName }) => traceName),
  )
  const sourceTraces = circuit.db.source_trace.list()
  const ddrConnectivityKeys: string[] = []
  for (const connection of signalConnections) {
    const sourceTrace = circuit.db.source_trace.getWhere({
      name: connection.traceName,
    })!
    const connectivityKey = sourceTrace.subcircuit_connectivity_map_key
    expect(connectivityKey).toBeDefined()
    if (!connectivityKey) {
      throw new Error(`Missing connectivity key for ${connection.traceName}`)
    }
    ddrConnectivityKeys.push(connectivityKey)
    const expectedPorts = [
      {
        ballName: connection.socBall,
        componentName: "U1",
        pinNumber: connection.socPinNumber,
        signalName: connection.socSignal,
      },
      {
        ballName: connection.memoryBall,
        componentName: "U2",
        pinNumber: connection.memoryPinNumber,
        signalName: connection.memorySignal,
      },
    ].map(({ ballName, componentName, pinNumber, signalName }) => {
      const component = circuit.db.source_component.getWhere({
        name: componentName,
      })!
      const port = circuit.db.source_port
        .list()
        .find(
          (candidate) =>
            candidate.source_component_id === component.source_component_id &&
            candidate.pin_number === pinNumber,
        )
      expect(port).toBeDefined()
      if (!port) {
        throw new Error(`Missing ${componentName} ${ballName}/${signalName}`)
      }
      expect(port.port_hints).toEqual(
        expect.arrayContaining([`pin${pinNumber}`, ballName, signalName]),
      )
      expect(
        sourceTraces
          .filter(
            (candidate) =>
              ddrTraceNames.has(candidate.name ?? "") &&
              candidate.connected_source_port_ids.includes(port.source_port_id),
          )
          .map((candidate) => candidate.name),
      ).toEqual([connection.traceName])
      const pcbPort = circuit.db.pcb_port.getWhere({
        source_port_id: port.source_port_id,
      })!
      expect(
        circuit.db.pcb_smtpad
          .list()
          .filter((pad) => pad.pcb_port_id === pcbPort.pcb_port_id),
      ).toHaveLength(1)
      return port
    })
    expect(sourceTrace.connected_source_port_ids.toSorted()).toEqual(
      expectedPorts.map((port) => port.source_port_id).toSorted(),
    )
    expect(sourceTrace.connected_source_net_ids).toEqual([])
  }
  expect(new Set(ddrConnectivityKeys).size).toBe(signalConnections.length)

  const allFanoutVias = circuit.db.pcb_via.list()
  for (const via of allFanoutVias) {
    expect(via.hole_diameter).toBeCloseTo(0.15)
    expect(via.outer_diameter).toBeCloseTo(0.24)
  }

  if (includePowerPlaneFanout) {
    expect(allFanoutVias).toHaveLength(
      routedPlaneDrops.length +
        signalConnections.length * 2 +
        renderedDirectDecouplingCapacitors.length * 2,
    )
    expect(
      new Set(
        allFanoutVias.map((via) => `${via.x.toFixed(9)},${via.y.toFixed(9)}`),
      ).size,
    ).toBe(allFanoutVias.length)
    let minViaCopperEdgeClearance = Number.POSITIVE_INFINITY
    for (let firstIndex = 0; firstIndex < allFanoutVias.length; firstIndex++) {
      const firstVia = allFanoutVias[firstIndex]!
      for (
        let secondIndex = firstIndex + 1;
        secondIndex < allFanoutVias.length;
        secondIndex++
      ) {
        const secondVia = allFanoutVias[secondIndex]!
        const centerDistance = Math.hypot(
          firstVia.x - secondVia.x,
          firstVia.y - secondVia.y,
        )
        minViaCopperEdgeClearance = Math.min(
          minViaCopperEdgeClearance,
          centerDistance -
            firstVia.outer_diameter / 2 -
            secondVia.outer_diameter / 2,
        )
      }
    }
    expect(minViaCopperEdgeClearance).toBeGreaterThanOrEqual(0.05 - 1e-6)
    for (const via of allFanoutVias) {
      expect(via.layers).toEqual(getViaBoardLayers(8))
    }
    const circularPads = circuit.db.pcb_smtpad
      .list()
      .filter((pad) => pad.shape === "circle")
    const padConnectivityKeyByPcbPortId = new Map(
      circuit.db.pcb_port
        .list()
        .map((pcbPort) => [
          pcbPort.pcb_port_id,
          circuit.db.source_port.get(pcbPort.source_port_id)
            ?.subcircuit_connectivity_map_key,
        ]),
    )
    const illegalViaPadClearances = allFanoutVias.flatMap((via) =>
      circularPads.flatMap((pad) => {
        const padConnectivityKey = pad.pcb_port_id
          ? padConnectivityKeyByPcbPortId.get(pad.pcb_port_id)
          : undefined
        if (
          via.subcircuit_connectivity_map_key !== undefined &&
          via.subcircuit_connectivity_map_key === padConnectivityKey
        ) {
          return []
        }
        const edgeClearance =
          Math.hypot(via.x - pad.x, via.y - pad.y) -
          via.outer_diameter / 2 -
          pad.radius
        return edgeClearance < minViaEdgeToPadEdgeClearance - 1e-6
          ? [{ viaId: via.pcb_via_id, padId: pad.pcb_smtpad_id, edgeClearance }]
          : []
      }),
    )
    expect(illegalViaPadClearances).toEqual([])
  }

  const ddrSourceTraceIds = new Set(
    signalConnections.map(
      ({ traceName }) =>
        circuit.db.source_trace.getWhere({ name: traceName })!.source_trace_id,
    ),
  )
  const ddrPcbTraces = circuit.db.pcb_trace
    .list()
    .filter(
      (pcbTrace) =>
        pcbTrace.source_trace_id !== undefined &&
        ddrSourceTraceIds.has(pcbTrace.source_trace_id),
    )
  expect(ddrPcbTraces).toHaveLength(signalConnections.length * 3)
  if (includePowerPlaneFanout) {
    const dmi1SourceTraceId = circuit.db.source_trace.getWhere({
      name: DDR_DMI1_CONNECTION.traceName,
    })!.source_trace_id
    const dmi1PcbTraces = ddrPcbTraces.filter(
      (pcbTrace) => pcbTrace.source_trace_id === dmi1SourceTraceId,
    )
    expect(dmi1PcbTraces).toHaveLength(3)
    expect(
      dmi1PcbTraces.every(
        (pcbTrace) => getPlanarRouteLength(pcbTrace.route) > 0,
      ),
    ).toBe(true)

    const clockEndToEndLengths = DDR_CLOCK_CONNECTIONS.map(({ traceName }) => {
      const sourceTraceId = circuit.db.source_trace.getWhere({
        name: traceName,
      })!.source_trace_id
      return ddrPcbTraces
        .filter((pcbTrace) => pcbTrace.source_trace_id === sourceTraceId)
        .reduce(
          (length, pcbTrace) => length + getPlanarRouteLength(pcbTrace.route),
          0,
        )
    })
    expect(clockEndToEndLengths).toHaveLength(2)
    expect(
      Math.abs(clockEndToEndLengths[0]! - clockEndToEndLengths[1]!),
    ).toBeLessThanOrEqual(CLOCK_MAX_END_TO_END_SKEW + 1e-6)

    const dqs0EndToEndLengths = DDR_DQS0_CONNECTIONS.map(({ traceName }) => {
      const sourceTraceId = circuit.db.source_trace.getWhere({
        name: traceName,
      })!.source_trace_id
      return ddrPcbTraces
        .filter((pcbTrace) => pcbTrace.source_trace_id === sourceTraceId)
        .reduce(
          (length, pcbTrace) => length + getPlanarRouteLength(pcbTrace.route),
          0,
        )
    })
    expect(dqs0EndToEndLengths).toHaveLength(2)
    expect(
      Math.abs(dqs0EndToEndLengths[0]! - dqs0EndToEndLengths[1]!),
    ).toBeLessThanOrEqual(DQS0_MAX_END_TO_END_SKEW + 1e-6)

    const dqs1EndToEndLengths = DDR_DQS1_CONNECTIONS.map(({ traceName }) => {
      const sourceTraceId = circuit.db.source_trace.getWhere({
        name: traceName,
      })!.source_trace_id
      return ddrPcbTraces
        .filter((pcbTrace) => pcbTrace.source_trace_id === sourceTraceId)
        .reduce(
          (length, pcbTrace) => length + getPlanarRouteLength(pcbTrace.route),
          0,
        )
    })
    expect(dqs1EndToEndLengths).toHaveLength(2)
    expect(
      Math.abs(dqs1EndToEndLengths[0]! - dqs1EndToEndLengths[1]!),
    ).toBeLessThanOrEqual(DQS1_MAX_END_TO_END_SKEW + 1e-6)

    const ddrRouteEndpointLayers = ddrPcbTraces.flatMap((trace) =>
      trace.route.flatMap((routePoint) => {
        if (routePoint.route_type === "wire") return [routePoint.layer]
        if (routePoint.route_type === "via") {
          return [routePoint.from_layer, routePoint.to_layer]
        }
        return []
      }),
    )
    expect(ddrRouteEndpointLayers).not.toContain(GROUND_PLANE_LAYER)
    expect(ddrRouteEndpointLayers).not.toContain(LPDDR4_POWER_PLANE_LAYER)
    expect(ddrRouteEndpointLayers).not.toContain(LPDDR4_VDD1_PLANE_LAYER)
  }
  await expect(circuit).toMatchPcbSnapshot(snapshotPath, {
    // circuit-to-svg gives copper pours a 0.5 fill opacity. Applying 0.2 alpha
    // to the plane-layer colors makes each pour effectively 0.1 opacity while
    // leaving the signal-layer copper fully opaque and easy to inspect.
    ...(includePowerPlaneFanout
      ? {
          colorOverrides: {
            copper: {
              inner1: "rgba(255, 140, 0, 0.2)",
              inner2: "rgba(255, 215, 0, 0.2)",
              inner3: "rgba(50, 205, 50, 0.2)",
            },
          },
        }
      : {}),
    diffThresholdPercent: snapshotDiffThresholdPercent,
  })
}
