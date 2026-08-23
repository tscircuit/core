import { expect, test } from "bun:test"
import { MT53E1G16D1ZW, ballMap } from "@tsci/0hmX.mt53e1g16d1zw-footprint"
import { AM62L32, AM62L32BOGHAANBR } from "@tsci/tscircuit.ti-am62l"
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
import { Children, Fragment, cloneElement, isValidElement } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

type DdrByteBusName = "DDR_BYTE0" | "DDR_BYTE1"

interface DdrConnection {
  busName: DdrByteBusName
  memorySignal: string
  socPin: number
  socSignal: string
  traceName: string
}

const DDR_CONNECTIONS: readonly DdrConnection[] = [
  ...[76, 91, 92, 93].map((socPin, bit) => ({
    busName: "DDR_BYTE0" as const,
    memorySignal: `DQ${bit}`,
    socPin,
    socSignal: `DDR0_DQ${bit}`,
    traceName: `DQ${bit}`,
  })),
  ...[236, 238, 255, 256].map((socPin, offset) => {
    const bit = offset + 8
    return {
      busName: "DDR_BYTE1" as const,
      memorySignal: `DQ${bit}`,
      socPin,
      socSignal: `DDR0_DQ${bit}`,
      traceName: `DQ${bit}`,
    }
  }),
]

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

const createAm62lEscapeFootprint = () => {
  const defaultChip = AM62L32BOGHAANBR({} as any)
  const defaultFootprint = defaultChip.props.footprint

  return cloneElement(
    defaultFootprint,
    {},
    Children.map(defaultFootprint.props.children, (child) =>
      isValidElement(child) && child.type === "smtpad"
        ? cloneElement(child, { radius: "0.12808mm" } as any)
        : child,
    ),
  )
}

const AM62L_ESCAPE_FOOTPRINT = createAm62lEscapeFootprint()

const usedSocPins = new Set(DDR_CONNECTIONS.map(({ socPin }) => socPin))
const socNoConnect = Array.from({ length: 373 }, (_, index) => index + 1)
  .filter((socPin) => !usedSocPins.has(socPin))
  .map((socPin) => `pin${socPin}`)

const usedMemorySignals = new Set(
  DDR_CONNECTIONS.map(({ memorySignal }) => memorySignal),
)
const memoryNoConnect = ballMap
  .map(({ signal }, index) => ({ signal, selector: `pin${index + 1}` }))
  .filter(({ signal }) => !usedMemorySignals.has(signal))
  .map(({ selector }) => selector)

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
      if (!first || !second || first.layer !== second.layer) {
        throw new Error(`${connection.name} fanout endpoint layers differ`)
      }
      const width =
        connection.nominalTraceWidth ??
        connection.width ??
        this.input.nominalTraceWidth ??
        this.input.minTraceWidth
      return {
        type: "pcb_trace" as const,
        pcb_trace_id: `am62l-middle-${connection.name}`,
        connection_name: connection.name,
        connectsTo: connection.pointsToConnect.flatMap((point) =>
          point.pointId ? [point.pointId] : [],
        ),
        route: [first, second].map((point) => ({
          route_type: "wire" as const,
          x: point.x,
          y: point.y,
          width,
          layer: point.layer,
        })),
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

test("routes two AM62L DDR byte buses through sibling BGA fanouts", async () => {
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
        <AM62L32
          name="U1"
          footprintVariant="fccsp_373_anb"
          footprint={AM62L_ESCAPE_FOOTPRINT}
          pcbRotation={180}
          noSchematicRepresentation
          noConnect={socNoConnect as any}
        />
      </breakout>

      <breakout
        name="RAM_FANOUT"
        pcbX={15.116917}
        pcbY={-0.050917}
        padding="4mm"
        autorouter="fanout"
        fanoutRoutingLayers={[...SIGNAL_LAYERS]}
      >
        <MT53E1G16D1ZW
          name="U2"
          pcbRotation={90}
          noSchematicRepresentation
          noConnect={memoryNoConnect as any}
        />
      </breakout>

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
        text="BGA fanout at each end; straight middle channel exposes exit ordering"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace.list()).toHaveLength(24)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
