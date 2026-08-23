import { expect, test } from "bun:test"
import type { ChipProps } from "@tscircuit/props"
import { Fragment } from "react"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

type DdrByteBusName = "DDR_BYTE0" | "DDR_BYTE1"

interface DdrConnection {
  busName: DdrByteBusName
  memorySignal: string
  socSignal: string
  traceName: string
}

const DDR_CONNECTIONS: readonly DdrConnection[] = [
  ...[0, 1, 2, 3, 4, 5, 6, 7].map((bit) => ({
    busName: "DDR_BYTE0" as const,
    memorySignal: `DQ${bit}`,
    socSignal: `DDR0_DQ${bit}`,
    traceName: `DQ${bit}`,
  })),
  ...[0, 1, 2, 3, 4, 5, 6, 7].map((offset) => {
    const bit = offset + 8
    return {
      busName: "DDR_BYTE1" as const,
      memorySignal: `DQ${bit}`,
      socSignal: `DDR0_DQ${bit}`,
      traceName: `DQ${bit}`,
    }
  }),
]

const AM62L_PIN_LABELS = {
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

// The real 373-ball FCCSP footprint is a 0.5 mm grid with depopulated rows.
// Keeping the row masks here makes the regression fixture independent of the
// generated registry package while preserving the package escape geometry.
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

const AM62L_PAD_POSITIONS = AM62L_ROW_MASKS.flatMap((rowMask, rowIndex) =>
  [...rowMask].flatMap((isPopulated, columnIndex) =>
    isPopulated === "1"
      ? [
          {
            x: -5.5 + columnIndex * 0.5,
            y: 5.5 - rowIndex * 0.5,
          },
        ]
      : [],
  ),
)

const Am62l32 = (props: ChipProps<typeof AM62L_PIN_LABELS>) => (
  <chip
    {...props}
    pinLabels={AM62L_PIN_LABELS}
    manufacturerPartNumber="AM62L32BOGHAANBR"
    footprint={
      <footprint>
        {AM62L_PAD_POSITIONS.map(({ x, y }, index) => (
          <Fragment key={`am62l-pad-${index + 1}`}>
            <smtpad
              portHints={[`pin${index + 1}`]}
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

const LPDDR4_PIN_LABELS = {
  pin12: ["DQ0"],
  pin14: ["DQ7"],
  pin17: ["DQ15"],
  pin19: ["DQ8"],
  pin22: ["DQ1"],
  pin24: ["DQ6"],
  pin27: ["DQ14"],
  pin29: ["DQ9"],
  pin42: ["DQ2"],
  pin44: ["DQ5"],
  pin47: ["DQ13"],
  pin49: ["DQ10"],
  pin52: ["DQ3"],
  pin54: ["DQ4"],
  pin57: ["DQ12"],
  pin59: ["DQ11"],
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
              portHints={[`pin${index + 1}`]}
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

const SIGNAL_LAYERS = ["top", "inner1", "inner2", "bottom"] as const

const byte0TraceNames = DDR_CONNECTIONS.filter(
  ({ busName }) => busName === "DDR_BYTE0",
).map(({ traceName }) => traceName)
const byte1TraceNames = DDR_CONNECTIONS.filter(
  ({ busName }) => busName === "DDR_BYTE1",
).map(({ traceName }) => traceName)

const FANOUT_BUSES = [
  {
    name: "DDR_BYTE0",
    connections: byte0TraceNames,
    preferredLayers: ["top", "inner1"],
  },
  {
    name: "DDR_BYTE1",
    connections: byte1TraceNames,
    preferredLayers: ["inner2", "bottom"],
  },
] as const

test("routes two DDR byte buses between AM62L and LPDDR4 fanouts", async () => {
  const { circuit } = getTestFixture()
  const autoroutingPhaseIoStack = createAutoroutingPhaseIoStack(circuit)

  circuit.add(
    <board
      name="AM62L_LPDDR4_TWO_BUS_FANOUT"
      width="42mm"
      height="26mm"
      layers={4}
      defaultTraceWidth="0.08128mm"
      minTraceWidth="0.08128mm"
      minTraceToPadEdgeClearance="0.05mm"
      minViaEdgeToPadEdgeClearance="0.08128mm"
      minViaHoleEdgeToViaHoleEdgeClearance="0.1016mm"
      minViaHoleDiameter="0.1mm"
      minViaPadDiameter="0.24mm"
      pcbStyle={{ viaHoleDiameter: "0.1mm", viaPadDiameter: "0.24mm" }}
      autorouter="default"
    >
      <breakout
        name="SOC_FANOUT"
        pcbX={-9.5}
        padding="4mm"
        autorouter="fanout"
        fanoutRoutingLayers={[...SIGNAL_LAYERS]}
        busFanoutDirections={{
          DDR_BYTE0: "top_center",
          DDR_BYTE1: "top_center",
        }}
      >
        <Am62l32 name="U1" noSchematicRepresentation />
      </breakout>

      <breakout
        name="DRAM_FANOUT"
        pcbX={9.616917}
        pcbY={-0.050917}
        padding="4mm"
        autorouter="fanout"
        fanoutRoutingLayers={[...SIGNAL_LAYERS]}
        busFanoutDirections={{
          DDR_BYTE0: "center_left",
          DDR_BYTE1: "center_left",
        }}
      >
        <Mt53e1g16d1zw name="U2" pcbRotation={90} noSchematicRepresentation />
      </breakout>

      {FANOUT_BUSES.map(({ name, connections, preferredLayers }) => (
        <Fragment key={name}>
          <bus
            name={name}
            connections={[...connections]}
            preferredLayers={[...preferredLayers]}
          />
        </Fragment>
      ))}

      {DDR_CONNECTIONS.map(({ memorySignal, socSignal, traceName }) => (
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
        text="AM62L32 to LPDDR4: full BYTE0 DQ0-DQ7 top/inner1, full BYTE1 DQ8-DQ15 inner2/bottom"
      />
      <pcbnotetext
        pcbX={0}
        pcbY={10.1}
        fontSize="0.6mm"
        text="AM62L fanout + DRAM fanout, then one default global routing phase"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(autoroutingPhaseIoStack).toHaveLength(3)
  expect(
    autoroutingPhaseIoStack.map(
      (phaseIo) => phaseIo.startSimpleRouteJson?.connections.length,
    ),
  ).toEqual([16, 16, 16])
  expect(autoroutingPhaseIoStack[2]?.startSimpleRouteJson?.traces).toHaveLength(
    32,
  )
  expect(circuit.db.pcb_trace.list()).toHaveLength(48)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
}, 300_000)
