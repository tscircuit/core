import { expect, test } from "bun:test"
import type { ChipProps } from "@tscircuit/props"
import type {
  AutorouterCompleteEvent,
  AutorouterErrorEvent,
  AutorouterProgressEvent,
  GenericLocalAutorouter,
} from "lib/utils/autorouting/GenericLocalAutorouter"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

type DdrByteBusName = "DDR_BYTE0" | "DDR_BYTE1"

interface DdrConnection {
  busName: DdrByteBusName
  memorySignal: string
  socSignal: string
  traceName: string
}

const DDR_CONNECTIONS: readonly DdrConnection[] = [
  ...[0, 1, 2, 3].map((bit) => ({
    busName: "DDR_BYTE0" as const,
    memorySignal: `DQ${bit}`,
    socSignal: `DDR0_DQ${bit}`,
    traceName: `DQ${bit}`,
  })),
  ...[0, 1, 2, 3].map((offset) => {
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
  pin236: ["T1", "DDR0_DQ10"],
  pin238: ["T3", "DDR0_DQ9"],
  pin255: ["U1", "DDR0_DQ11"],
  pin275: ["V4", "DDR0_DQ8"],
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
  pin19: ["DQ8"],
  pin22: ["DQ1"],
  pin29: ["DQ9"],
  pin42: ["DQ2"],
  pin49: ["DQ10"],
  pin52: ["DQ3"],
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

const SIGNAL_LAYERS = [
  "top",
  "inner1",
  "inner2",
  "inner3",
  "inner4",
  "inner5",
  "inner6",
  "bottom",
] as const

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
    preferredLayer: "inner2",
  },
  {
    name: "DDR_BYTE1",
    connections: byte1TraceNames,
    preferredLayer: "inner3",
  },
] as const

type ListenerMap = {
  complete: Array<(event: AutorouterCompleteEvent) => void>
  error: Array<(event: AutorouterErrorEvent) => void>
  progress: Array<(event: AutorouterProgressEvent) => void>
}

/**
 * Join Core's synchronized breakout endpoints directly so this snapshot shows
 * fanout exit ordering without adding a second routing heuristic.
 */
class DirectMiddleChannelAutorouter implements GenericLocalAutorouter {
  isRouting = false
  private outputSimpleRouteJson?: SimpleRouteJson
  private readonly listeners: ListenerMap = {
    complete: [],
    error: [],
    progress: [],
  }

  constructor(public readonly input: SimpleRouteJson) {}

  private solve(): SimplifiedPcbTrace[] {
    const traces = this.input.connections.map((connection) => {
      if (connection.pointsToConnect.length !== 2) {
        throw new Error(
          `${connection.name} expected two synchronized fanout endpoints`,
        )
      }
      const [first, second] = connection.pointsToConnect
      if (!first || !second) {
        throw new Error(`${connection.name} fanout endpoint is missing`)
      }
      const width =
        connection.nominalTraceWidth ??
        connection.width ??
        this.input.nominalTraceWidth ??
        this.input.minTraceWidth
      const [left, right] =
        first.x <= second.x ? [first, second] : [second, first]
      const route: SimplifiedPcbTrace["route"] = [
        {
          route_type: "wire",
          x: left.x,
          y: left.y,
          width,
          layer: left.layer,
        },
        {
          route_type: "wire",
          x: right.x,
          y: right.y,
          width,
          layer: left.layer,
        },
      ]
      if (left.layer !== right.layer) {
        route.push(
          {
            route_type: "via",
            x: right.x,
            y: right.y,
            from_layer: left.layer,
            to_layer: right.layer,
          },
          {
            route_type: "wire",
            x: right.x,
            y: right.y,
            width,
            layer: right.layer,
          },
        )
      }
      return {
        type: "pcb_trace" as const,
        pcb_trace_id: `am62l-middle-${connection.name}`,
        connection_name: connection.name,
        connectsTo: connection.pointsToConnect.flatMap((point) =>
          point.pointId ? [point.pointId] : [],
        ),
        route,
      }
    })
    this.outputSimpleRouteJson = {
      ...this.input,
      traces: [...(this.input.traces ?? []), ...traces],
    }
    return traces
  }

  start(): void {
    this.isRouting = true
    queueMicrotask(() => {
      try {
        const traces = this.solve()
        this.isRouting = false
        for (const listener of this.listeners.complete) {
          listener({ type: "complete", traces })
        }
      } catch (error) {
        this.isRouting = false
        const normalizedError =
          error instanceof Error ? error : new Error(String(error))
        for (const listener of this.listeners.error) {
          listener({ type: "error", error: normalizedError })
        }
      }
    })
  }

  stop(): void {
    this.isRouting = false
  }

  on(
    event: "complete",
    callback: (event: AutorouterCompleteEvent) => void,
  ): void
  on(event: "error", callback: (event: AutorouterErrorEvent) => void): void
  on(
    event: "progress",
    callback: (event: AutorouterProgressEvent) => void,
  ): void
  on(
    event: keyof ListenerMap,
    callback:
      | ((event: AutorouterCompleteEvent) => void)
      | ((event: AutorouterErrorEvent) => void)
      | ((event: AutorouterProgressEvent) => void),
  ): void {
    this.listeners[event].push(callback as never)
  }

  solveSync(): SimplifiedPcbTrace[] {
    return this.solve()
  }

  getOutputSimpleRouteJson(): SimpleRouteJson | undefined {
    return this.outputSimpleRouteJson
  }
}

test("routes two DDR byte buses through an AM62L BGA fanout", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      name="AM62L_LPDDR4_TWO_BUS_FANOUT"
      width="70mm"
      height="30mm"
      layers={8}
      defaultTraceWidth="0.08128mm"
      minTraceWidth="0.08128mm"
      minTraceToPadEdgeClearance="0.05mm"
      minViaEdgeToPadEdgeClearance="0.08128mm"
      minViaHoleEdgeToViaHoleEdgeClearance="0.1016mm"
      minViaHoleDiameter="0.1mm"
      minViaPadDiameter="0.24mm"
      pcbStyle={{ viaHoleDiameter: "0.1mm", viaPadDiameter: "0.24mm" }}
      autorouter={{
        local: true,
        groupMode: "subcircuit",
        algorithmFn: async (input) => new DirectMiddleChannelAutorouter(input),
      }}
    >
      <breakout
        name="SOC_FANOUT"
        pcbX={-15}
        padding="4mm"
        autorouter="fanout"
        fanoutRoutingLayers={[...SIGNAL_LAYERS]}
      >
        <Am62l32 name="U1" noSchematicRepresentation />
      </breakout>

      <Mt53e1g16d1zw
        name="U2"
        pcbX={15.116917}
        pcbY={-0.050917}
        pcbRotation={90}
        noSchematicRepresentation
      />

      {FANOUT_BUSES.map(
        ({ name, connections, preferredLayer }, routingPhaseIndex) => (
          <Fragment key={name}>
            <bus
              name={name}
              connections={[...connections]}
              preferredLayer={preferredLayer}
              routingPhaseIndex={routingPhaseIndex}
            />
          </Fragment>
        ),
      )}

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
        pcbY={13.2}
        fontSize="0.7mm"
        text="AM62L32 to LPDDR4: BYTE0 gold/inner2, BYTE1 green/inner3 (8 DQ signals)"
      />
      <pcbnotetext
        pcbX={0}
        pcbY={11.9}
        fontSize="0.6mm"
        text="AM62L BGA fanout; straight middle channel exposes exit ordering"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace.list()).toHaveLength(16)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
