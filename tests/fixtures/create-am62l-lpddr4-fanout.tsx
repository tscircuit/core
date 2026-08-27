import { expect } from "bun:test"
import type { ChipProps } from "@tscircuit/props"
import type { GenericLocalAutorouter } from "lib/utils/autorouting/GenericLocalAutorouter"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { getViaBoardLayers } from "lib/utils/getViaSpanLayers"
import { Fragment } from "react"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

type DdrBusName = "DDR_BYTE0" | "DDR_BYTE1" | "DDR_ADDR_CTRL"

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

const DDR_SIGNAL_CONNECTIONS = [
  ...DDR_CONNECTIONS,
  ...DDR_ADDR_CTRL_CONNECTIONS,
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

const AM62L_VDDS_DDR_BALLS = ["L8", "M7", "M8", "N8", "P8"] as const
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

const AM62L_POWER_BALLS = [
  ...AM62L_VSS_BALLS.map((ballName) => ({
    ballName,
    pinNumber: getRequiredPinNumber(
      AM62L_PIN_NUMBER_BY_BALL,
      ballName,
      "AM62L",
    ),
    pinSignal: "VSS" as const,
  })),
  ...AM62L_VDDS_DDR_BALLS.map((ballName) => ({
    ballName,
    pinNumber: getRequiredPinNumber(
      AM62L_PIN_NUMBER_BY_BALL,
      ballName,
      "AM62L",
    ),
    pinSignal: "VDDS_DDR" as const,
  })),
]

const AM62L_PIN_LABELS = {
  ...Object.fromEntries(
    AM62L_POWER_BALLS.map(({ ballName, pinNumber, pinSignal }) => [
      `pin${pinNumber}`,
      [ballName, pinSignal],
    ]),
  ),
  ...Object.fromEntries(
    DDR_ADDR_CTRL_CONNECTIONS.map(({ socBall, socPinNumber, socSignal }) => [
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
    DDR_ADDR_CTRL_CONNECTIONS.map(
      ({ memoryBall, memoryPinNumber, memorySignal }) => [
        `pin${memoryPinNumber}`,
        [memoryBall, memorySignal],
      ],
    ),
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
const BYTE0_MAX_FANOUT_SKEW = 8
const BYTE1_MAX_FANOUT_SKEW = 14.5
const ADDR_CTRL_MAX_FANOUT_SKEW = 15

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
  includePowerPlaneFanout = false,
  snapshotPath,
}: {
  fanoutAlgorithmFn?: FanoutAlgorithmFn
  fanoutSolverLabel: string
  includePowerPlaneFanout?: boolean
  snapshotPath: string
}) => {
  const { circuit } = getTestFixture()
  const autoroutingPhaseIoStack = createAutoroutingPhaseIoStack(circuit)
  const fanoutAutorouter = fanoutAlgorithmFn
    ? { preset: "fanout" as const, algorithmFn: fanoutAlgorithmFn }
    : "fanout"
  const signalLayers = includePowerPlaneFanout
    ? POWER_FANOUT_SIGNAL_LAYERS
    : SIGNAL_ONLY_LAYERS
  const signalConnections = includePowerPlaneFanout
    ? DDR_SIGNAL_CONNECTIONS
    : DDR_CONNECTIONS
  const fanoutBuses = FANOUT_BUSES.filter(
    (bus) => includePowerPlaneFanout || bus.name !== "DDR_ADDR_CTRL",
  ).map((bus) => ({
    ...bus,
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
  const socPlaneDrops = includePowerPlaneFanout ? SOC_PLANE_DROPS : []
  const dramPlaneDrops = includePowerPlaneFanout ? DRAM_PLANE_DROPS : []
  const planeDrops = includePowerPlaneFanout ? PLANE_DROPS : []

  expect(AM62L_PAD_POSITIONS).toHaveLength(373)
  expect(AM62L_VSS_BALLS).toHaveLength(97)
  expect(AM62L_VDDS_DDR_BALLS).toHaveLength(5)
  expect(LPDDR4_BALL_NAMES).toHaveLength(200)
  expect(LPDDR4_VSS_BALLS).toHaveLength(58)
  expect(LPDDR4_VDDQ_BALLS).toHaveLength(20)
  expect(LPDDR4_VDD2_BALLS).toHaveLength(24)
  expect(LPDDR4_VDD1_BALLS).toHaveLength(8)

  circuit.add(
    <board
      name={
        includePowerPlaneFanout
          ? "AM62L_LPDDR4_THREE_BUS_FANOUT"
          : "AM62L_LPDDR4_TWO_BUS_FANOUT"
      }
      width="42mm"
      height="26mm"
      layers={includePowerPlaneFanout ? 8 : 4}
      defaultTraceWidth="0.08128mm"
      minTraceWidth="0.08128mm"
      minTraceToPadEdgeClearance="0.05mm"
      minViaEdgeToPadEdgeClearance="0.08128mm"
      minViaHoleEdgeToViaHoleEdgeClearance="0.1016mm"
      minViaHoleDiameter="0.1mm"
      minViaPadDiameter="0.24mm"
      pcbStyle={{ viaHoleDiameter: "0.1mm", viaPadDiameter: "0.24mm" }}
      allowBlindAndBuriedVias={false}
      isViaInPadAllowed={false}
      autorouter="default"
    >
      <autoroutingphase
        autorouter={{
          algorithmFn: createBasicAutorouter(routeConnectionsDirectly),
        }}
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
        pcbX={-9.5}
        padding={includePowerPlaneFanout ? "3mm" : "2mm"}
        autorouter={fanoutAutorouter}
        fanoutRoutingLayers={[...signalLayers]}
        busFanoutDirections={{
          DDR_BYTE0: "rightside_top",
          DDR_BYTE1: "rightside_bottom",
          ...(includePowerPlaneFanout
            ? { DDR_ADDR_CTRL: "rightside_center" as const }
            : {}),
        }}
      >
        <Am62l32 name="U1" noSchematicRepresentation />
        {socPlaneDrops.map((drop) => (
          <Fragment key={drop.traceName}>
            <trace
              name={drop.traceName}
              from={`.U1 > .${drop.ballName}`}
              to={`net.${drop.netName}`}
            />
          </Fragment>
        ))}
      </breakout>

      <breakout
        name="DRAM_FANOUT"
        pcbX={9.616917}
        pcbY={-0.050917}
        padding={includePowerPlaneFanout ? "3mm" : "2.5mm"}
        autorouter={fanoutAutorouter}
        fanoutRoutingLayers={[...signalLayers]}
        busFanoutDirections={{
          DDR_BYTE0: "leftside_center",
          DDR_BYTE1: "leftside_center",
          ...(includePowerPlaneFanout
            ? { DDR_ADDR_CTRL: "leftside_center" as const }
            : {}),
        }}
      >
        <Mt53e1g16d1zw name="U2" pcbRotation={90} noSchematicRepresentation />
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

      {signalConnections.map(({ memorySignal, socSignal, traceName }) => (
        <Fragment key={traceName}>
          <trace
            name={traceName}
            from={`U1.${socSignal}`}
            to={`U2.${memorySignal}`}
          />
        </Fragment>
      ))}

      <pcbnotetext
        pcbX={0}
        pcbY={11.2}
        fontSize="0.7mm"
        text={
          includePowerPlaneFanout
            ? "AM62L32 to LPDDR4: BYTE0 top/inner4, BYTE1 inner5/bottom, ADDR_CTRL inner6; GND inner1, VDD_LPDDR4 inner2, SOC_DVDD1V8 inner3"
            : "AM62L32 to LPDDR4: full BYTE0 DQ0-DQ7 top/inner1, full BYTE1 DQ8-DQ15 inner2/bottom"
        }
      />
      <pcbnotetext
        pcbX={0}
        pcbY={10.1}
        fontSize="0.6mm"
        text={
          includePowerPlaneFanout
            ? `${fanoutSolverLabel}; BYTE0 skew <= ${BYTE0_MAX_FANOUT_SKEW} mm, BYTE1 <= ${BYTE1_MAX_FANOUT_SKEW} mm, ADDR_CTRL <= ${ADDR_CTRL_MAX_FANOUT_SKEW} mm; ${PLANE_DROPS.length + signalConnections.length * 2} dogbone vias span all 8 layers`
            : `${fanoutSolverLabel}; BYTE0 fanout skew <= ${BYTE0_MAX_FANOUT_SKEW} mm`
        }
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace_error.list()).toEqual([])
  expect(circuit.db.pcb_via_trace_clearance_error.list()).toEqual([])
  const pcbBoard = circuit.db.pcb_board.list()[0]!
  if (includePowerPlaneFanout) {
    expect(circuit.db.pcb_pad_trace_clearance_error.list()).toEqual([])
    expect(circuit.db.pcb_via_clearance_error.list()).toEqual([])
    expect(pcbBoard.allow_blind_and_buried_vias).toBe(false)
    expect(pcbBoard.is_via_in_pad_allowed).toBe(false)
    expect(pcbBoard.min_via_edge_to_pad_edge_clearance).toBeCloseTo(0.08128)
  }
  const minViaEdgeToPadEdgeClearance =
    pcbBoard.min_via_edge_to_pad_edge_clearance!
  expect(SOC_PLANE_DROPS).toHaveLength(102)
  expect(DRAM_PLANE_DROPS).toHaveLength(110)
  expect(autoroutingPhaseIoStack).toHaveLength(3)
  expect(
    autoroutingPhaseIoStack.map(
      (phaseIo) => phaseIo.startSimpleRouteJson?.connections.length,
    ),
  ).toEqual([
    signalConnections.length + socPlaneDrops.length,
    signalConnections.length + dramPlaneDrops.length,
    signalConnections.length,
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
  const byteExitYByBus = new Map<"DDR_BYTE0" | "DDR_BYTE1", number[]>()
  for (const [busId, expectedYSign] of [
    ["DDR_BYTE0", 1],
    ["DDR_BYTE1", -1],
  ] as const) {
    const bus = socFanoutInput.buses?.find((bus) => bus.busId === busId)
    expect(bus?.connectionNames).toHaveLength(8)
    const connectionNames = new Set(bus?.connectionNames ?? [])
    const exitPoints = (socFanoutPhase.endSimpleRouteJson?.traces ?? [])
      .filter((trace) => connectionNames.has(trace.connection_name ?? ""))
      .map((trace) =>
        trace.route.findLast((routePoint) => routePoint.route_type === "wire"),
      )
    expect(exitPoints).toHaveLength(8)
    const exitYCoordinates: number[] = []
    for (const exitPoint of exitPoints) {
      expect(exitPoint).toBeDefined()
      if (!exitPoint) throw new Error(`Missing ${busId} fanout exit point`)
      expect(exitPoint.x).toBeCloseTo(socFanoutInput.bounds.maxX)
      expect((exitPoint.y - socFanoutCenterY) * expectedYSign).toBeGreaterThan(
        0,
      )
      expect(exitPoint.y).toBeGreaterThan(socFanoutInput.bounds.minY)
      expect(exitPoint.y).toBeLessThan(socFanoutInput.bounds.maxY)
      exitYCoordinates.push(exitPoint.y)
    }
    byteExitYByBus.set(busId, exitYCoordinates)
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
      Math.max(...byteExitYByBus.get("DDR_BYTE1")!),
    )
    expect(Math.max(...addrCtrlExitYCoordinates)).toBeLessThan(
      Math.min(...byteExitYByBus.get("DDR_BYTE0")!),
    )
  }
  expect(autoroutingPhaseIoStack[2]?.startSimpleRouteJson?.traces).toHaveLength(
    signalConnections.length * 2 + planeDrops.length,
  )
  const globalPhaseInput = autoroutingPhaseIoStack[2]!.startSimpleRouteJson!
  expect(getStraightLineWindingConflicts(globalPhaseInput)).toEqual([])
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
    for (const planeDrop of PLANE_DROPS) {
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
      expect(getPlanarRouteLength(matchingPcbTraces[0]!.route)).toBeGreaterThan(
        0,
      )
      const routeVias = matchingPcbTraces[0]!.route.filter(
        (routePoint) => routePoint.route_type === "via",
      )
      expect(routeVias).toHaveLength(1)
      expect(routeVias[0]).toMatchObject({
        from_layer: "top",
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
      expect(matchingVia.from_layer).toBe("top")
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
      const matchingPour = copperPours.find(
        (pour) =>
          pour.layer === planeDrop.layer &&
          pour.source_net_id === expectedNet.source_net_id,
      )
      expect(matchingPour).toBeDefined()
    }

    const planeNetNames = ["GND", LPDDR4_POWER_NET, LPDDR4_VDD1_NET] as const
    const sourceComponentById = new Map(
      ["U1", "U2"].map((componentName) => {
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
      PLANE_DROPS.map((drop) => ({
        componentName: drop.componentName,
        netName: drop.netName,
        pinNumber: drop.pinNumber,
      })).toSorted((first, second) =>
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

  if (includePowerPlaneFanout) {
    const allFanoutVias = circuit.db.pcb_via.list()
    expect(allFanoutVias).toHaveLength(
      PLANE_DROPS.length + signalConnections.length * 2,
    )
    expect(
      new Set(
        allFanoutVias.map((via) => `${via.x.toFixed(9)},${via.y.toFixed(9)}`),
      ).size,
    ).toBe(allFanoutVias.length)
    for (const via of allFanoutVias) {
      expect(via.layers).toEqual(getViaBoardLayers(8))
    }
    const circularPads = circuit.db.pcb_smtpad
      .list()
      .filter((pad) => pad.shape === "circle")
    const illegalViaPadClearances = allFanoutVias.flatMap((via) =>
      circularPads.flatMap((pad) => {
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
    diffThresholdPercent: 0.05,
  })
}
